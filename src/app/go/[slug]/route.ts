import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /go/[slug]
 *
 * Server-side redirect for casino partner links.
 * - The real destination URL is NEVER sent to the browser.
 * - Ad blockers / VPNs cannot intercept it (just a normal internal page to them).
 * - Click tracking happens server-side so it cannot be blocked by the client.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "";

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Look up the offer by slug
  const { data: offer } = await supabase
    .from("casino_offers")
    .select("id, name, affiliate_url")
    .eq("slug", slug)
    .eq("visible", true)
    .single();

  // If not found, redirect home
  if (!offer?.affiliate_url) {
    return NextResponse.redirect(new URL("/ofertas", process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.brutuspolus.com"));
  }

  // Ensure destination is an absolute URL
  const destination = offer.affiliate_url.startsWith("http")
    ? offer.affiliate_url
    : `https://${offer.affiliate_url}`;

  // Server-side click tracking (cannot be blocked by ad blockers)
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

    // Resolve user_id from session cookie if present
    let userId: string | null = null;
    const sessionCookie = cookieStore.get("twitch_session")?.value;
    if (sessionCookie) {
      try {
        const session = JSON.parse(sessionCookie);
        if (session?.id) {
          const { data: user } = await supabase
            .from("users")
            .select("id")
            .eq("twitch_id", session.id)
            .single();
          userId = user?.id ?? null;
        }
      } catch {
        // Ignore session parse errors
      }
    }

    await supabase.from("analytics_events").insert({
      event_type: "offer_click",
      page_url: `/go/${slug}`,
      offer_id: offer.id,
      user_id: userId,
      session_token: sessionToken,
      ip_address: ip,
      referrer,
      metadata: { offer_name: offer.name, slug },
    });
  } catch {
    // Never block the redirect due to a tracking error
  }

  return NextResponse.redirect(destination, { status: 302 });
}
