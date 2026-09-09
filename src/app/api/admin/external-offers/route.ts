import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import {
  DEFAULT_EXTERNAL_OFFER_SITE,
  isExternalOfferSiteSlug,
} from "@/lib/externalOfferSites";
import type {
  CasinoOfferRow,
  ExternalOfferSiteItemRow,
  ExternalOfferSiteRow,
} from "@/lib/supabase";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ExternalCasinoOffer = Omit<CasinoOfferRow, "is_exclusive"> & {
  is_exclusive?: boolean;
};

type AdminItem = {
  id: string | null;
  offer_id: string;
  visible: boolean;
  featured: boolean;
  sort_order: number;
  custom_headline: string | null;
  custom_bonus_value: string | null;
  custom_cta_label: string | null;
  offer: ExternalCasinoOffer;
};

type RawPayloadItem = {
  offerId?: unknown;
  visible?: unknown;
  featured?: unknown;
  sortOrder?: unknown;
  customHeadline?: unknown;
  customBonusValue?: unknown;
  customCtaLabel?: unknown;
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
  const [offersRes, itemsRes] = await Promise.all([
    db
      .from("casino_offers")
      .select(
        "id, slug, name, logo_url, logo_bg, banner_url, badge, tags, headline, bonus_value, free_spins, min_deposit, code, cashback, withdraw_time, license, established, notes, affiliate_url, rating, visible, sort_order, created_at, updated_at",
      )
      .order("sort_order", { ascending: true }),
    db
      .from("external_offer_site_items")
      .select("*")
      .eq("site_id", site.id)
      .order("sort_order", { ascending: true }),
  ]);

  if (offersRes.error) throw offersRes.error;
  if (itemsRes.error) throw itemsRes.error;

  const offers = (offersRes.data ?? []) as ExternalCasinoOffer[];
  const items = (itemsRes.data ?? []) as ExternalOfferSiteItemRow[];
  const itemByOfferId = new Map(items.map((item) => [item.offer_id, item]));

  const missingRows = offers
    .filter((offer) => !itemByOfferId.has(offer.id))
    .map((offer) => ({
      site_id: site.id,
      offer_id: offer.id,
      visible: offer.visible,
      featured: false,
      sort_order: offer.sort_order,
      updated_at: new Date().toISOString(),
    }));

  if (missingRows.length > 0) {
    const { data: inserted, error } = await db
      .from("external_offer_site_items")
      .insert(missingRows)
      .select("*");

    if (error) throw error;
    for (const item of (inserted ?? []) as ExternalOfferSiteItemRow[]) {
      itemByOfferId.set(item.offer_id, item);
    }
  }

  const adminItems: AdminItem[] = offers
    .map((offer) => {
      const item = itemByOfferId.get(offer.id);
      return {
        id: item?.id ?? null,
        offer_id: offer.id,
        visible: item?.visible ?? offer.visible,
        featured: item?.featured ?? false,
        sort_order: item?.sort_order ?? offer.sort_order,
        custom_headline: item?.custom_headline ?? null,
        custom_bonus_value: item?.custom_bonus_value ?? null,
        custom_cta_label: item?.custom_cta_label ?? null,
        offer,
      };
    })
    .sort((a, b) => a.sort_order - b.sort_order || a.offer.name.localeCompare(b.offer.name));

  return {
    site,
    items: adminItems,
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
    items?: RawPayloadItem[];
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

    const payloadItems = Array.isArray(body.items) ? body.items : [];
    const rows = payloadItems.flatMap((item, index) => {
      if (typeof item.offerId !== "string" || !UUID_RE.test(item.offerId)) {
        return [];
      }

      return [
        {
          site_id: site.id,
          offer_id: item.offerId,
          visible: Boolean(item.visible),
          featured: Boolean(item.featured),
          sort_order: int(item.sortOrder, index),
          custom_headline: nullableText(item.customHeadline, 160),
          custom_bonus_value: nullableText(item.customBonusValue, 80),
          custom_cta_label: nullableText(item.customCtaLabel, 40),
          updated_at: now,
        },
      ];
    });

    if (rows.length > 0) {
      const { error: itemsError } = await db
        .from("external_offer_site_items")
        .upsert(rows, { onConflict: "site_id,offer_id" });

      if (itemsError) throw itemsError;
    }

    const state = await readAdminState(db, site);
    return NextResponse.json(state);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
