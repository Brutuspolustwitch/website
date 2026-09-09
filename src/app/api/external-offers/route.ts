import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  DEFAULT_EXTERNAL_OFFER_SITE,
  isExternalOfferSiteSlug,
} from "@/lib/externalOfferSites";
import type { ExternalOfferSiteRow, ExternalSiteOfferRow } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
};

function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...CORS_HEADERS,
      ...(init?.headers ?? {}),
    },
  });
}

function publicBaseUrl(request: Request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return (configured || new URL(request.url).origin).replace(/\/$/, "");
}

function absoluteUrl(value: string | null | undefined, baseUrl: string) {
  const clean = value?.trim();
  if (!clean) return null;
  if (/^https?:\/\//i.test(clean)) return clean;
  if (clean.startsWith("/")) return `${baseUrl}${clean}`;
  return clean;
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedSite =
    searchParams.get("site") ?? DEFAULT_EXTERNAL_OFFER_SITE.slug;
  const siteSlug = requestedSite.trim();

  if (!isExternalOfferSiteSlug(siteSlug)) {
    return json({ error: "Invalid site" }, { status: 400 });
  }

  const { data: site, error: siteError } = await supabase
    .from("external_offer_sites")
    .select("*")
    .eq("slug", siteSlug)
    .maybeSingle<ExternalOfferSiteRow>();

  if (siteError) {
    return json({ error: siteError.message }, { status: 500 });
  }

  if (!site || !site.is_active) {
    return json({
      site: site
        ? {
            slug: site.slug,
            name: site.name,
            title: site.title,
            description: site.description,
            ctaLabel: site.cta_label,
            active: site.is_active,
          }
        : null,
      offers: [],
    });
  }

  const { data, error } = await supabase
    .from("external_site_offers")
    .select(
      "id, site_id, slug, name, logo_url, logo_bg, banner_url, badge, tags, headline, bonus_value, free_spins, min_deposit, code, cashback, withdraw_time, license, established, notes, rating, visible, featured, sort_order, cta_label, created_at, updated_at",
    )
    .eq("site_id", site.id)
    .eq("visible", true)
    .order("sort_order", { ascending: true });

  if (error) {
    return json({ error: error.message }, { status: 500 });
  }

  const baseUrl = publicBaseUrl(request);
  const offers = ((data ?? []) as ExternalSiteOfferRow[]).map((offer) => ({
    id: offer.id,
    slug: offer.slug,
    name: offer.name,
    logoUrl: absoluteUrl(offer.logo_url, baseUrl),
    logoBg: offer.logo_bg,
    bannerUrl: absoluteUrl(offer.banner_url, baseUrl),
    badge: offer.badge,
    tags: offer.tags ?? [],
    headline: offer.headline,
    bonusValue: offer.bonus_value,
    freeSpins: offer.free_spins,
    minDeposit: offer.min_deposit,
    code: offer.code,
    cashback: offer.cashback,
    withdrawTime: offer.withdraw_time,
    license: offer.license,
    established: offer.established,
    notes: offer.notes ?? [],
    rating: Number(offer.rating ?? 5),
    featured: offer.featured,
    ctaLabel: offer.cta_label || site.cta_label,
    url: `${baseUrl}/go/${offer.slug}?site=${encodeURIComponent(site.slug)}`,
  }));

  return json({
    site: {
      slug: site.slug,
      name: site.name,
      title: site.title,
      description: site.description,
      ctaLabel: site.cta_label,
      active: site.is_active,
    },
    offers,
  });
}
