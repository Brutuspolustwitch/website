import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import {
  DEFAULT_EXTERNAL_OFFER_SITE,
  isExternalOfferSiteSlug,
} from "@/lib/externalOfferSites";
import type { ExternalOfferSiteRow, ExternalSiteOfferRow } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const OFFER_SLUG_RE = /^[a-z0-9][a-z0-9-]{0,78}[a-z0-9]$/;
const BADGES = new Set(["NEW", "HOT", "TOP"]);

type RawPayloadOffer = {
  id?: unknown;
  slug?: unknown;
  name?: unknown;
  logoUrl?: unknown;
  logoBg?: unknown;
  bannerUrl?: unknown;
  badge?: unknown;
  tags?: unknown;
  headline?: unknown;
  bonusValue?: unknown;
  freeSpins?: unknown;
  minDeposit?: unknown;
  code?: unknown;
  cashback?: unknown;
  withdrawTime?: unknown;
  license?: unknown;
  established?: unknown;
  notes?: unknown;
  affiliateUrl?: unknown;
  ctaLabel?: unknown;
  rating?: unknown;
  visible?: unknown;
  featured?: unknown;
  sortOrder?: unknown;
};

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL are required for external offer site management.",
    );
  }
  return createClient(url, key);
}

async function requireAdmin() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("twitch_session")?.value;
  if (!raw) return false;

  try {
    const session = JSON.parse(raw) as { role?: string };
    return session.role === "admin" || session.role === "configurador";
  } catch {
    return false;
  }
}

function sanitizeSiteSlug(value: unknown) {
  const slug =
    typeof value === "string"
      ? value.trim()
      : DEFAULT_EXTERNAL_OFFER_SITE.slug;
  return isExternalOfferSiteSlug(slug) ? slug : null;
}

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function nullableText(value: unknown, max: number) {
  const next = text(value, max);
  return next ? next : null;
}

function int(value: unknown, fallback: number) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

function rating(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return 5;
  return Math.min(5, Math.max(0, Math.round(parsed * 10) / 10));
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function cleanSlug(slugValue: unknown, nameValue: unknown) {
  const proposed = text(slugValue, 80) || slugify(text(nameValue, 120));
  const slug = slugify(proposed);
  return OFFER_SLUG_RE.test(slug) ? slug : "";
}

function textList(value: unknown, maxItems = 12) {
  const input = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/\r?\n|,/)
      : [];

  return input
    .flatMap((item) => (typeof item === "string" ? [item.trim()] : []))
    .filter(Boolean)
    .slice(0, maxItems);
}

function cleanBadge(value: unknown) {
  const badge = text(value, 12).toUpperCase();
  return BADGES.has(badge) ? badge : null;
}

async function ensureSite(
  db: ReturnType<typeof getServiceRoleClient>,
  slug: string,
) {
  const { data: existing, error: existingError } = await db
    .from("external_offer_sites")
    .select("*")
    .eq("slug", slug)
    .maybeSingle<ExternalOfferSiteRow>();

  if (existingError) throw existingError;
  if (existing) return existing;

  const defaults = {
    slug,
    name:
      slug === DEFAULT_EXTERNAL_OFFER_SITE.slug
        ? DEFAULT_EXTERNAL_OFFER_SITE.name
        : slug.replace(/-/g, " "),
    title:
      slug === DEFAULT_EXTERNAL_OFFER_SITE.slug
        ? DEFAULT_EXTERNAL_OFFER_SITE.title
        : "Ofertas",
    description:
      slug === DEFAULT_EXTERNAL_OFFER_SITE.slug
        ? DEFAULT_EXTERNAL_OFFER_SITE.description
        : "",
    cta_label: DEFAULT_EXTERNAL_OFFER_SITE.ctaLabel,
    is_active: true,
  };

  const { data, error } = await db
    .from("external_offer_sites")
    .insert(defaults)
    .select("*")
    .single<ExternalOfferSiteRow>();

  if (error) throw error;
  return data;
}

async function readAdminState(
  db: ReturnType<typeof getServiceRoleClient>,
  site: ExternalOfferSiteRow,
) {
  const { data, error } = await db
    .from("external_site_offers")
    .select("*")
    .eq("site_id", site.id)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return {
    site,
    offers: ((data ?? []) as ExternalSiteOfferRow[]).sort(
      (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name),
    ),
  };
}

export async function GET(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const siteSlug = sanitizeSiteSlug(searchParams.get("site"));
  if (!siteSlug) {
    return NextResponse.json({ error: "Site inválido" }, { status: 400 });
  }

  try {
    const db = getServiceRoleClient();
    const site = await ensureSite(db, siteSlug);
    const state = await readAdminState(db, site);
    return NextResponse.json(state);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    siteSlug?: unknown;
    site?: {
      title?: unknown;
      description?: unknown;
      ctaLabel?: unknown;
      isActive?: unknown;
    };
    offers?: RawPayloadOffer[];
    deletedOfferIds?: unknown;
  } | null;

  const siteSlug = sanitizeSiteSlug(body?.siteSlug);
  if (!body || !siteSlug) {
    return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
  }

  try {
    const db = getServiceRoleClient();
    const existingSite = await ensureSite(db, siteSlug);
    const now = new Date().toISOString();

    const sitePatch = {
      title: text(body.site?.title, 120) || DEFAULT_EXTERNAL_OFFER_SITE.title,
      description: text(body.site?.description, 240),
      cta_label:
        text(body.site?.ctaLabel, 40) || DEFAULT_EXTERNAL_OFFER_SITE.ctaLabel,
      is_active: Boolean(body.site?.isActive),
      updated_at: now,
    };

    const { data: site, error: siteError } = await db
      .from("external_offer_sites")
      .update(sitePatch)
      .eq("id", existingSite.id)
      .select("*")
      .single<ExternalOfferSiteRow>();

    if (siteError) throw siteError;

    const deletedOfferIds = Array.isArray(body.deletedOfferIds)
      ? body.deletedOfferIds.filter(
          (id): id is string => typeof id === "string" && UUID_RE.test(id),
        )
      : [];

    if (deletedOfferIds.length > 0) {
      const { error } = await db
        .from("external_site_offers")
        .delete()
        .eq("site_id", site.id)
        .in("id", deletedOfferIds);

      if (error) throw error;
    }

    const payloadOffers = Array.isArray(body.offers) ? body.offers : [];
    const rows = payloadOffers.flatMap((offer, index) => {
      const name = text(offer.name, 120);
      const slug = cleanSlug(offer.slug, offer.name);
      const headline = text(offer.headline, 160);
      const affiliateUrl = text(offer.affiliateUrl, 2048);

      if (!name || !slug || !headline || !affiliateUrl) {
        return [];
      }

      return [
        {
          id:
            typeof offer.id === "string" && UUID_RE.test(offer.id)
              ? offer.id
              : null,
          site_id: site.id,
          slug,
          name,
          logo_url: nullableText(offer.logoUrl, 2048),
          logo_bg: text(offer.logoBg, 24) || "#666666",
          banner_url: nullableText(offer.bannerUrl, 2048),
          badge: cleanBadge(offer.badge),
          tags: textList(offer.tags),
          headline,
          bonus_value: text(offer.bonusValue, 100),
          free_spins: text(offer.freeSpins, 80),
          min_deposit: text(offer.minDeposit, 80),
          code: text(offer.code, 80),
          cashback: nullableText(offer.cashback, 80),
          withdraw_time: text(offer.withdrawTime, 80),
          license: text(offer.license, 80),
          established: text(offer.established, 80),
          notes: textList(offer.notes, 20),
          affiliate_url: affiliateUrl,
          cta_label: nullableText(offer.ctaLabel, 40),
          rating: rating(offer.rating),
          visible: Boolean(offer.visible),
          featured: Boolean(offer.featured),
          sort_order: int(offer.sortOrder, index),
          updated_at: now,
        },
      ];
    });

    const existingRows = rows.filter((row) => row.id);
    const newRows = rows.filter((row) => !row.id).map((row) => ({
      site_id: row.site_id,
      slug: row.slug,
      name: row.name,
      logo_url: row.logo_url,
      logo_bg: row.logo_bg,
      banner_url: row.banner_url,
      badge: row.badge,
      tags: row.tags,
      headline: row.headline,
      bonus_value: row.bonus_value,
      free_spins: row.free_spins,
      min_deposit: row.min_deposit,
      code: row.code,
      cashback: row.cashback,
      withdraw_time: row.withdraw_time,
      license: row.license,
      established: row.established,
      notes: row.notes,
      affiliate_url: row.affiliate_url,
      cta_label: row.cta_label,
      rating: row.rating,
      visible: row.visible,
      featured: row.featured,
      sort_order: row.sort_order,
      updated_at: row.updated_at,
    }));

    for (const row of existingRows) {
      const { id, ...patch } = row;
      const { error } = await db
        .from("external_site_offers")
        .update(patch)
        .eq("site_id", site.id)
        .eq("id", id);

      if (error) throw error;
    }

    if (newRows.length > 0) {
      const { error } = await db.from("external_site_offers").insert(newRows);
      if (error) throw error;
    }

    const state = await readAdminState(db, site);
    return NextResponse.json(state);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
