import { DEFAULT_EXTERNAL_OFFER_SITE, isExternalOfferSiteSlug } from "@/lib/externalOfferSites";

export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store" };

export async function GET() {
  try {
    const origin = new URL(
      process.env.NEXT_PUBLIC_BRUTUSPOLUS_OFFERS_ORIGIN?.trim() ||
        "https://www.brutuspolus.com",
    );
    const site = process.env.NEXT_PUBLIC_EXTERNAL_OFFERS_SITE?.trim() ||
      DEFAULT_EXTERNAL_OFFER_SITE.slug;

    if (!["https:", "http:"].includes(origin.protocol) || !isExternalOfferSiteSlug(site)) {
      throw new Error("Invalid offers configuration");
    }

    // Read the public feed backed by brutuspolusWS's Supabase tables.
    // Keep its media and tracked /go links intact; no database credentials or
    // visitor cookies are forwarded to the upstream server.
    const url = new URL("/api/external-offers", origin);
    url.searchParams.set("site", site);
    const response = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error("Offers feed unavailable");
    const data = await response.json();
    if (!data || !Array.isArray(data.offers) || !("site" in data)) {
      throw new Error("Invalid offers feed");
    }
    return Response.json(data, { headers });
  } catch {
    return Response.json(
      { error: "Ofertas indisponíveis de momento." },
      { status: 502, headers },
    );
  }
}
