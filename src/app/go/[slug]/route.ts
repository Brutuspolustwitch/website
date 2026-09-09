import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { isExternalOfferSiteSlug } from "@/lib/externalOfferSites";

type RedirectOffer = {
  id: string;
  name: string;
  affiliate_url: string;
  source: "casino" | "external";
  site?: string;
};

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "";

  return createClient(supabaseUrl, supabaseKey);
}

function redirectToOffers() {
  return NextResponse.redirect(
    new URL("/ofertas", process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.brutuspolus.com"),
  );
}

function normalizeDestination(value: string) {
  return value.startsWith("http") ? value : `https://${value}`;
}

async function findExternalOffer(
  db: ReturnType<typeof getSupabaseClient>,
  siteSlug: string,
  offerSlug: string,
): Promise<RedirectOffer | null> {
  const { data: site } = await db
    .from("external_offer_sites")
    .select("id, slug, is_active")
    .eq("slug", siteSlug)
    .maybeSingle();

  if (!site?.id || site.is_active === false) return null;

  const { data: offer } = await db
    .from("external_site_offers")
    .select("id, name, affiliate_url")
    .eq("site_id", site.id)
    .eq("slug", offerSlug)
    .eq("visible", true)
    .maybeSingle();

  if (!offer?.affiliate_url) return null;

  return {
    id: offer.id,
    name: offer.name,
    affiliate_url: offer.affiliate_url,
    source: "external",
    site: site.slug,
  };
}

async function findCasinoOffer(
  db: ReturnType<typeof getSupabaseClient>,
  slug: string,
): Promise<RedirectOffer | null> {
  const { data: offer } = await db
    .from("casino_offers")
    .select("id, name, affiliate_url")
    .eq("slug", slug)
    .single();

  if (!offer?.affiliate_url) return null;

  return {
    id: offer.id,
    name: offer.name,
    affiliate_url: offer.affiliate_url,
    source: "casino",
  };
}

/**
 * GET /go/[slug]
 *
 * Server-side redirect for casino partner links.
 * - The real destination URL is never sent to the browser before redirect.
 * - Arena dos Bónus can use standalone offers via /go/slug?site=arena-dos-bonus.
 * - Brutuspolus offers keep the existing /go/slug behavior.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const siteSlug = searchParams.get("site")?.trim();
  const db = getSupabaseClient();

  let offer: RedirectOffer | null = null;

  if (siteSlug && isExternalOfferSiteSlug(siteSlug)) {
    offer = await findExternalOffer(db, siteSlug, slug);
  }

  if (!offer) {
    offer = await findCasinoOffer(db, slug);
  }

  if (!offer?.affiliate_url) {
    return redirectToOffers();
  }

  const destination = normalizeDestination(offer.affiliate_url);

  try {
    const headerStore = await headers();
    const cookieStore = await cookies();

    const ip =
      headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headerStore.get("x-real-ip") ||
      headerStore.get("cf-connecting-ip") ||
      "unknown";

    const referrer = headerStore.get("referer") || null;
    const sessionToken = cookieStore.get("arena_session")?.value || null;

    let userId: string | null = null;
    const sessionCookie = cookieStore.get("twitch_session")?.value;
    if (sessionCookie) {
      try {
        const session = JSON.parse(sessionCookie);
        if (session?.id) {
          const { data: user } = await db
            .from("users")
            .select("id")
            .eq("twitch_id", session.id)
            .single();
          userId = user?.id ?? null;
        }
      } catch {
        // Ignore session parse errors.
      }
    }

    await db.from("analytics_events").insert({
      event_type: "offer_click",
      page_url: `/go/${slug}${offer.site ? `?site=${offer.site}` : ""}`,
      offer_id: offer.source === "casino" ? offer.id : null,
      user_id: userId,
      session_token: sessionToken,
      ip_address: ip,
      referrer,
      metadata: {
        offer_name: offer.name,
        slug,
        source: offer.source,
        external_offer_id: offer.source === "external" ? offer.id : null,
        site: offer.site ?? null,
      },
    });
  } catch {
    // Never block the redirect due to a tracking error.
  }

  return NextResponse.redirect(destination, { status: 302 });
}
