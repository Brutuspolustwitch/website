"use client";

import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  Filter,
  Image as ImageIcon,
  Plus,
  RotateCcw,
  Save,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ExternalOfferSiteRow, ExternalSiteOfferRow } from "@/lib/supabase";
import { DEFAULT_EXTERNAL_OFFER_SITE } from "@/lib/externalOfferSites";

type EditableOffer = {
  localKey: string;
  id: string | null;
  slug: string;
  name: string;
  logoUrl: string;
  logoBg: string;
  bannerUrl: string;
  badge: "" | "NEW" | "HOT" | "TOP";
  tags: string;
  headline: string;
  bonusValue: string;
  freeSpins: string;
  minDeposit: string;
  code: string;
  cashback: string;
  withdrawTime: string;
  license: string;
  established: string;
  notes: string;
  affiliateUrl: string;
  offerCtaLabel: string;
  logoScale: string;
  rating: string;
  visible: boolean;
  featured: boolean;
  sortOrder: number;
};

type ApiResponse = {
  site?: ExternalOfferSiteRow;
  offers?: ExternalSiteOfferRow[];
  error?: string;
};

type StatusFilter = "all" | "visible" | "hidden" | "featured";
type BadgeFilter = "all" | "none" | "NEW" | "HOT" | "TOP";
type MediaFilter = "all" | "with-media" | "missing-media" | "banner" | "logo";
type SortMode = "manual" | "name" | "rating" | "status";

const SITE_SLUG = DEFAULT_EXTERNAL_OFFER_SITE.slug;
const OFFERS_PER_PAGE = 6;
const INPUT_CLASS =
  "w-full bg-arena-iron/70 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-arena-smoke/35 focus:outline-none focus:border-arena-gold/50";
const SELECT_CLASS = `${INPUT_CLASS} appearance-none`;
const TEXTAREA_CLASS = `${INPUT_CLASS} min-h-20 resize-y`;
const ICON_BUTTON_CLASS =
  "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-arena-smoke hover:border-arena-gold/40 hover:text-arena-gold disabled:cursor-not-allowed disabled:opacity-30";

function getPublicOrigin() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://www.brutuspolus.com"
  );
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

function listToText(value: string[]) {
  return value.join("\n");
}

function textToList(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function canPreviewImage(value: string) {
  const clean = value.trim();
  return clean.startsWith("/") || /^https?:\/\//i.test(clean);
}

function messageFromUnknown(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message) return message;
  }
  return fallback;
}

function normalizeOrder(offers: EditableOffer[]) {
  return offers.map((offer, index) => ({ ...offer, sortOrder: index }));
}

function normalizeSearch(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function clampLogoScale(value: string | number) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(2, Math.max(0.5, Math.round(parsed * 100) / 100));
}

function formatScale(value: string | number) {
  return `${Math.round(clampLogoScale(value) * 100)}%`;
}

function cssImage(value: string) {
  return `url("${value.trim().replace(/\\/g, "\\\\").replace(/"/g, '\\"')}")`;
}

function stars(rating: string) {
  const rounded = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return Array.from({ length: 5 }, (_, index) =>
    index < rounded ? "★" : "☆",
  ).join("");
}

function getOfferMedia(offer: EditableOffer) {
  return offer.bannerUrl.trim() || offer.logoUrl.trim();
}

function getMediaMode(offer: EditableOffer) {
  return offer.bannerUrl.trim() ? "banner" : "logo";
}

function hasMedia(offer: EditableOffer) {
  return canPreviewImage(getOfferMedia(offer));
}

function toEditableOffer(offer: ExternalSiteOfferRow): EditableOffer {
  return {
    localKey: offer.id,
    id: offer.id,
    slug: offer.slug,
    name: offer.name,
    logoUrl: offer.logo_url ?? "",
    logoBg: offer.logo_bg,
    bannerUrl: offer.banner_url ?? "",
    badge: offer.badge ?? "",
    tags: listToText(offer.tags ?? []),
    headline: offer.headline,
    bonusValue: offer.bonus_value,
    freeSpins: offer.free_spins,
    minDeposit: offer.min_deposit,
    code: offer.code,
    cashback: offer.cashback ?? "",
    withdrawTime: offer.withdraw_time,
    license: offer.license,
    established: offer.established,
    notes: listToText(offer.notes ?? []),
    affiliateUrl: offer.affiliate_url,
    offerCtaLabel: offer.cta_label ?? "",
    logoScale: String(clampLogoScale(offer.logo_scale ?? 1)),
    rating: String(offer.rating ?? 5),
    visible: offer.visible,
    featured: offer.featured,
    sortOrder: offer.sort_order,
  };
}

function createEmptyOffer(nextOrder: number): EditableOffer {
  return {
    localKey: `new-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    id: null,
    slug: "",
    name: "",
    logoUrl: "",
    logoBg: "#666666",
    bannerUrl: "",
    badge: "",
    tags: "",
    headline: "",
    bonusValue: "",
    freeSpins: "",
    minDeposit: "",
    code: "",
    cashback: "",
    withdrawTime: "0 - 24h",
    license: "Portugal",
    established: "",
    notes: "",
    affiliateUrl: "",
    offerCtaLabel: "",
    logoScale: "1",
    rating: "5",
    visible: true,
    featured: false,
    sortOrder: nextOrder,
  };
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`space-y-1 ${className}`}>
      <span className="text-[11px] uppercase tracking-wider text-arena-ash">
        {label}
      </span>
      {children}
    </label>
  );
}

function MiniMedia({ offer }: { offer: EditableOffer }) {
  const media = getOfferMedia(offer);
  const mediaMode = getMediaMode(offer);

  return (
    <div
      className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md border border-white/10 bg-center bg-no-repeat"
      style={{
        backgroundColor: offer.logoBg || "#666666",
        backgroundImage: canPreviewImage(media) ? cssImage(media) : undefined,
        backgroundSize: mediaMode === "banner" ? "cover" : "contain",
      }}
    >
      {!canPreviewImage(media) && (
        <div className="flex h-full w-full items-center justify-center text-lg font-black text-white">
          {offer.name.trim().slice(0, 1) || "?"}
        </div>
      )}
    </div>
  );
}

function OfferPreview({
  offer,
  defaultCta,
}: {
  offer: EditableOffer;
  defaultCta: string;
}) {
  const media = getOfferMedia(offer);
  const mediaMode = getMediaMode(offer);
  const mediaScale = clampLogoScale(offer.logoScale);
  const tags = textToList(offer.tags).slice(0, 3);
  const notes = textToList(offer.notes).slice(0, 3);
  const code = offer.code.trim();
  const details = [
    offer.freeSpins.trim() ? `${offer.freeSpins.trim()} Free Spins` : "",
    offer.cashback.trim() ? `${offer.cashback.trim()} Cashback` : "",
    offer.minDeposit.trim() ? `Min. ${offer.minDeposit.trim()}` : "",
  ].filter(Boolean);

  return (
    <article
      className={`overflow-hidden rounded-lg border bg-gradient-to-b from-[#20150c] to-[#0c0805] shadow-2xl ${
        offer.featured
          ? "border-arena-gold/70 shadow-arena-gold/10"
          : "border-arena-gold/30"
      }`}
    >
      <a
        href={`/go/${slugify(offer.slug || offer.name)}?site=${SITE_SLUG}`}
        target="_blank"
        rel="noreferrer noopener"
        className="flex min-h-full flex-col text-inherit no-underline"
      >
        <div
          className="relative aspect-video overflow-hidden"
          style={{ backgroundColor: offer.logoBg || "#2b2117" }}
        >
          {canPreviewImage(media) ? (
            <div
              className="absolute inset-0 bg-center bg-no-repeat transition-transform duration-300"
              style={{
                backgroundImage: cssImage(media),
                backgroundSize: mediaMode === "banner" ? "cover" : "contain",
                transform: `scale(${mediaScale})`,
              }}
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center text-5xl font-black text-white"
              style={{ backgroundColor: offer.logoBg || "#666666" }}
            >
              {offer.name.trim().slice(0, 1) || "?"}
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 to-transparent" />
          {offer.badge && (
            <span className="absolute right-3 top-3 rounded-full border border-arena-gold/40 bg-arena-crimson px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white">
              {offer.badge}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.12em] text-arena-smoke/70">
            <span className="truncate">{offer.name || "Nome da oferta"}</span>
            <span className="shrink-0 text-arena-gold">
              {stars(offer.rating)}
            </span>
          </div>
          <h3 className="m-0 text-xl font-black leading-tight tracking-normal text-[#fff7df]">
            {offer.headline || "Headline da oferta"}
            <strong className="block text-[1.2em] text-arena-gold-light">
              {offer.bonusValue || "Valor do bónus"}
            </strong>
          </h3>
          {details.length > 0 && (
            <p className="m-0 text-sm font-bold text-[#d9b85b]">
              {details.join(" · ")}
            </p>
          )}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-arena-gold/25 bg-arena-gold/10 px-2 py-1 text-[11px] text-[#f6ead1]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          {code && code !== "—" && (
            <div className="flex w-full items-center justify-between gap-3 rounded-lg border border-dashed border-arena-gold/45 bg-arena-gold/10 px-3 py-2 text-left text-arena-gold-light">
              <span className="text-[11px] uppercase tracking-wider text-[#f6ead1]/55">
                Código
              </span>
              <strong className="text-sm tracking-[0.1em]">{code}</strong>
            </div>
          )}
          {notes.length > 0 && (
            <ul className="m-0 space-y-1 pl-4 text-xs leading-relaxed text-[#f6ead1]/60">
              {notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          )}
          <span className="mt-auto flex items-center justify-center rounded-lg bg-gradient-to-b from-arena-gold to-[#9d7020] px-3 py-3 text-xs font-black uppercase tracking-[0.1em] text-[#130b04]">
            {offer.offerCtaLabel || defaultCta || "Apostar Agora"}
          </span>
          <p className="m-0 text-center text-[11px] text-[#f6ead1]/45">
            18+ · T&amp;Cs aplicáveis · Joga com responsabilidade
          </p>
        </div>
      </a>
    </article>
  );
}

export default function ExternalSitesAdminPage() {
  const [site, setSite] = useState<ExternalOfferSiteRow | null>(null);
  const [offers, setOffers] = useState<EditableOffer[]>([]);
  const [deletedOfferIds, setDeletedOfferIds] = useState<string[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [title, setTitle] = useState<string>(DEFAULT_EXTERNAL_OFFER_SITE.title);
  const [description, setDescription] = useState<string>(
    DEFAULT_EXTERNAL_OFFER_SITE.description,
  );
  const [ctaLabel, setCtaLabel] = useState<string>(
    DEFAULT_EXTERNAL_OFFER_SITE.ctaLabel,
  );
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [badgeFilter, setBadgeFilter] = useState<BadgeFilter>("all");
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("manual");
  const [page, setPage] = useState(1);

  const publicOrigin = getPublicOrigin();
  const apiUrl = `${publicOrigin}/api/external-offers?site=${SITE_SLUG}`;
  const widgetUrl = `${publicOrigin}/external-offers-widget.js`;
  const embedSnippet = `<div id="arena-dos-bonus-offers"></div>
<script src="${widgetUrl}" data-site="${SITE_SLUG}" data-target="arena-dos-bonus-offers"></script>`;

  const sortedOffers = useMemo(
    () =>
      [...offers].sort(
        (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
      ),
    [offers],
  );

  const filteredOffers = useMemo(() => {
    const cleanQuery = normalizeSearch(query.trim());

    return sortedOffers.filter((offer) => {
      const searchable = normalizeSearch(
        [
          offer.name,
          offer.slug,
          offer.headline,
          offer.bonusValue,
          offer.code,
          offer.tags,
          offer.notes,
        ].join(" "),
      );
      const matchesQuery = !cleanQuery || searchable.includes(cleanQuery);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "visible" && offer.visible) ||
        (statusFilter === "hidden" && !offer.visible) ||
        (statusFilter === "featured" && offer.featured);
      const matchesBadge =
        badgeFilter === "all" ||
        (badgeFilter === "none" && !offer.badge) ||
        offer.badge === badgeFilter;
      const matchesMedia =
        mediaFilter === "all" ||
        (mediaFilter === "with-media" && hasMedia(offer)) ||
        (mediaFilter === "missing-media" && !hasMedia(offer)) ||
        (mediaFilter === "banner" && canPreviewImage(offer.bannerUrl)) ||
        (mediaFilter === "logo" &&
          !offer.bannerUrl.trim() &&
          canPreviewImage(offer.logoUrl));

      return matchesQuery && matchesStatus && matchesBadge && matchesMedia;
    });
  }, [badgeFilter, mediaFilter, query, sortedOffers, statusFilter]);

  const displayOffers = useMemo(() => {
    const next = [...filteredOffers];
    if (sortMode === "name") {
      next.sort((a, b) => a.name.localeCompare(b.name));
    }
    if (sortMode === "rating") {
      next.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    }
    if (sortMode === "status") {
      next.sort(
        (a, b) =>
          Number(b.visible) - Number(a.visible) ||
          Number(b.featured) - Number(a.featured) ||
          a.sortOrder - b.sortOrder,
      );
    }
    return next;
  }, [filteredOffers, sortMode]);

  const totalPages = Math.max(1, Math.ceil(displayOffers.length / OFFERS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageOffers = displayOffers.slice(
    (safePage - 1) * OFFERS_PER_PAGE,
    safePage * OFFERS_PER_PAGE,
  );

  const selectedOffer = useMemo(
    () =>
      sortedOffers.find((offer) => offer.localKey === selectedKey) ??
      displayOffers[0] ??
      sortedOffers[0] ??
      null,
    [displayOffers, selectedKey, sortedOffers],
  );

  const enabledCount = sortedOffers.filter((offer) => offer.visible).length;
  const hiddenCount = sortedOffers.length - enabledCount;
  const featuredCount = sortedOffers.filter((offer) => offer.featured).length;
  const missingMediaCount = sortedOffers.filter((offer) => !hasMedia(offer)).length;
  const dirtyCount = deletedOfferIds.length;

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/external-offers?site=${SITE_SLUG}`, {
        cache: "no-store",
      });
      const data = (await res.json().catch(() => ({}))) as ApiResponse;

      if (!res.ok || data.error) {
        setMessage({
          ok: false,
          text: data.error ?? "Erro ao carregar site externo.",
        });
        return;
      }

      if (data.site) {
        setSite(data.site);
        setTitle(data.site.title);
        setDescription(data.site.description);
        setCtaLabel(data.site.cta_label);
        setIsActive(data.site.is_active);
      }

      const nextOffers = normalizeOrder((data.offers ?? []).map(toEditableOffer));
      setOffers(nextOffers);
      setSelectedKey(nextOffers[0]?.localKey ?? null);
      setDeletedOfferIds([]);
      setPage(1);
    } catch (error) {
      setMessage({
        ok: false,
        text: messageFromUnknown(error, "Erro ao carregar site externo."),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    if (!selectedKey && sortedOffers.length > 0) {
      setSelectedKey(sortedOffers[0].localKey);
    }
  }, [selectedKey, sortedOffers]);

  function updateOffer(localKey: string, patch: Partial<EditableOffer>) {
    setOffers((current) =>
      current.map((offer) =>
        offer.localKey === localKey ? { ...offer, ...patch } : offer,
      ),
    );
  }

  function addOffer() {
    const offer = createEmptyOffer(offers.length);
    setOffers((current) => [...current, offer]);
    setSelectedKey(offer.localKey);
    setPage(1);
  }

  function deleteOffer(offer: EditableOffer) {
    if (!confirm(`Apagar a oferta "${offer.name || "sem nome"}"?`)) return;

    const ordered = normalizeOrder(
      sortedOffers.filter((item) => item.localKey !== offer.localKey),
    );
    setOffers(ordered);
    setSelectedKey((current) =>
      current === offer.localKey ? ordered[0]?.localKey ?? null : current,
    );
    if (offer.id) {
      setDeletedOfferIds((current) => [...current, offer.id as string]);
    }
  }

  function moveOffer(localKey: string, direction: -1 | 1) {
    setOffers((current) => {
      const ordered = normalizeOrder(
        [...current].sort(
          (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
        ),
      );
      const index = ordered.findIndex((offer) => offer.localKey === localKey);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= ordered.length) {
        return current;
      }

      const [offer] = ordered.splice(index, 1);
      ordered.splice(nextIndex, 0, offer);
      return normalizeOrder(ordered);
    });
  }

  function resetFilters() {
    setQuery("");
    setStatusFilter("all");
    setBadgeFilter("all");
    setMediaFilter("all");
    setSortMode("manual");
    setPage(1);
  }

  async function copy(text: string) {
    if (!navigator.clipboard) {
      setMessage({ ok: false, text: "Clipboard indisponível neste browser." });
      return;
    }
    await navigator.clipboard.writeText(text);
    setMessage({ ok: true, text: "Copiado." });
  }

  async function save() {
    const normalizedOffers = normalizeOrder(sortedOffers);
    const slugs = normalizedOffers.map((offer) => slugify(offer.slug));
    const duplicateSlug = slugs.find(
      (slug, index) => slug && slugs.indexOf(slug) !== index,
    );
    const incomplete = normalizedOffers.find(
      (offer) =>
        !offer.name.trim() ||
        !slugify(offer.slug || offer.name) ||
        !offer.headline.trim() ||
        !offer.affiliateUrl.trim(),
    );

    if (duplicateSlug) {
      setMessage({ ok: false, text: `Slug repetido: ${duplicateSlug}` });
      return;
    }

    if (incomplete) {
      setMessage({
        ok: false,
        text: "Cada oferta precisa de nome, slug, headline e link afiliado.",
      });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/external-offers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteSlug: SITE_SLUG,
          site: {
            title,
            description,
            ctaLabel,
            isActive,
          },
          deletedOfferIds,
          offers: normalizedOffers.map((offer) => ({
            id: offer.id,
            slug: slugify(offer.slug || offer.name),
            name: offer.name,
            logoUrl: offer.logoUrl,
            logoBg: offer.logoBg,
            bannerUrl: offer.bannerUrl,
            badge: offer.badge,
            tags: textToList(offer.tags),
            headline: offer.headline,
            bonusValue: offer.bonusValue,
            freeSpins: offer.freeSpins,
            minDeposit: offer.minDeposit,
            code: offer.code,
            cashback: offer.cashback,
            withdrawTime: offer.withdrawTime,
            license: offer.license,
            established: offer.established,
            notes: textToList(offer.notes),
            affiliateUrl: offer.affiliateUrl,
            ctaLabel: offer.offerCtaLabel,
            logoScale: clampLogoScale(offer.logoScale),
            rating: Number(offer.rating) || 5,
            visible: offer.visible,
            featured: offer.featured,
            sortOrder: offer.sortOrder,
          })),
        }),
      });
      const data = (await res.json()) as ApiResponse;

      if (!res.ok || data.error) {
        setMessage({
          ok: false,
          text: data.error ?? "Erro ao guardar alterações.",
        });
        return;
      }

      if (data.site) {
        setSite(data.site);
        setTitle(data.site.title);
        setDescription(data.site.description);
        setCtaLabel(data.site.cta_label);
        setIsActive(data.site.is_active);
      }
      const nextOffers = normalizeOrder((data.offers ?? []).map(toEditableOffer));
      setOffers(nextOffers);
      setSelectedKey((current) =>
        current && nextOffers.some((offer) => offer.localKey === current)
          ? current
          : nextOffers[0]?.localKey ?? null,
      );
      setDeletedOfferIds([]);
      setMessage({ ok: true, text: "Arena dos Bónus atualizada." });
    } catch (error) {
      setMessage({
        ok: false,
        text: messageFromUnknown(error, "Erro ao guardar alterações."),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen pb-16 pt-24">
      <div className="mx-auto max-w-[1500px] space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-arena-smoke/50">
              Sites Externos
            </p>
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl tracking-wide text-arena-gold">
              Arena dos Bónus
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-arena-smoke/60">
              Controla uma lista de ofertas própria para o Arena dos Bónus. Esta
              lista não altera as parcerias que aparecem no Brutuspolus.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={addOffer}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-arena-gold/35 bg-arena-gold/15 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-arena-gold transition-colors hover:bg-arena-gold/25 disabled:opacity-50"
            >
              <Plus size={16} />
              Nova Oferta
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving || loading}
              className="inline-flex items-center gap-2 rounded-lg border border-arena-gold/35 bg-arena-gold/20 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-arena-gold-light transition-colors hover:bg-arena-gold/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? "A guardar..." : "Guardar"}
            </button>
          </div>
        </div>

        {message && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              message.ok
                ? "border-green-500/25 bg-green-950/20 text-green-300"
                : "border-red-500/25 bg-red-950/20 text-red-300"
            }`}
          >
            {message.text}
          </div>
        )}

        <section className="rounded-lg border border-arena-gold/20 bg-arena-charcoal/60 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-sm uppercase tracking-widest text-arena-gold">
                Ligação ao site
              </h2>
              <p className="mt-1 text-xs text-arena-smoke/50">
                {enabledCount} ofertas ativas no feed.
              </p>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-arena-smoke">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
                className="h-4 w-4 accent-arena-gold"
              />
              Site ativo
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Título">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Descrição" className="md:col-span-2">
              <input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="CTA padrão">
              <input
                value={ctaLabel}
                onChange={(event) => setCtaLabel(event.target.value)}
                className={INPUT_CLASS}
              />
            </Field>
            <div className="grid gap-3 md:col-span-2 sm:grid-cols-2">
              <div className="min-w-0 rounded-lg border border-white/10 bg-black/30 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-[11px] uppercase tracking-wider text-arena-ash">
                    API
                  </span>
                  <button
                    type="button"
                    onClick={() => copy(apiUrl)}
                    className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-arena-gold hover:underline"
                  >
                    <Copy size={12} />
                    Copiar
                  </button>
                </div>
                <code className="block break-all text-xs text-arena-smoke/70">
                  {apiUrl}
                </code>
              </div>
              <div className="min-w-0 rounded-lg border border-white/10 bg-black/30 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-[11px] uppercase tracking-wider text-arena-ash">
                    Widget
                  </span>
                  <button
                    type="button"
                    onClick={() => copy(embedSnippet)}
                    className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-arena-gold hover:underline"
                  >
                    <Copy size={12} />
                    Copiar
                  </button>
                </div>
                <code className="block whitespace-pre-wrap break-all text-xs text-arena-smoke/70">
                  {embedSnippet}
                </code>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(430px,0.9fr)_minmax(0,1.5fr)]">
          <div className="space-y-4">
            <div className="rounded-lg border border-white/10 bg-arena-charcoal/60">
              <div className="border-b border-white/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-[family-name:var(--font-display)] text-sm uppercase tracking-widest text-arena-gold">
                      Ofertas próprias do Arena
                    </h2>
                    <p className="mt-1 text-xs text-arena-smoke/50">
                      {displayOffers.length} de {sortedOffers.length} ofertas nos filtros.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs uppercase tracking-wider text-arena-smoke hover:border-arena-gold/35 hover:text-arena-gold"
                  >
                    <RotateCcw size={14} />
                    Limpar
                  </button>
                </div>
              </div>

              <div className="grid gap-3 border-b border-white/10 p-4 sm:grid-cols-2">
                <div className="relative sm:col-span-2">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-arena-ash"
                  />
                  <input
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setPage(1);
                    }}
                    placeholder="Pesquisar por nome, slug, headline, código..."
                    className={`${INPUT_CLASS} pl-9`}
                  />
                </div>
                <Field label="Estado">
                  <select
                    value={statusFilter}
                    onChange={(event) => {
                      setStatusFilter(event.target.value as StatusFilter);
                      setPage(1);
                    }}
                    className={SELECT_CLASS}
                  >
                    <option value="all">Todos</option>
                    <option value="visible">Ativas</option>
                    <option value="hidden">Ocultas</option>
                    <option value="featured">Destacadas</option>
                  </select>
                </Field>
                <Field label="Badge">
                  <select
                    value={badgeFilter}
                    onChange={(event) => {
                      setBadgeFilter(event.target.value as BadgeFilter);
                      setPage(1);
                    }}
                    className={SELECT_CLASS}
                  >
                    <option value="all">Todos</option>
                    <option value="none">Sem badge</option>
                    <option value="NEW">NEW</option>
                    <option value="HOT">HOT</option>
                    <option value="TOP">TOP</option>
                  </select>
                </Field>
                <Field label="Imagem">
                  <select
                    value={mediaFilter}
                    onChange={(event) => {
                      setMediaFilter(event.target.value as MediaFilter);
                      setPage(1);
                    }}
                    className={SELECT_CLASS}
                  >
                    <option value="all">Todas</option>
                    <option value="with-media">Com imagem</option>
                    <option value="missing-media">Sem imagem</option>
                    <option value="banner">Com banner</option>
                    <option value="logo">Só logo</option>
                  </select>
                </Field>
                <Field label="Ordenar">
                  <select
                    value={sortMode}
                    onChange={(event) => {
                      setSortMode(event.target.value as SortMode);
                      setPage(1);
                    }}
                    className={SELECT_CLASS}
                  >
                    <option value="manual">Ordem manual</option>
                    <option value="name">Nome</option>
                    <option value="rating">Rating</option>
                    <option value="status">Estado</option>
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-2 border-b border-white/10 p-4 text-xs sm:grid-cols-4">
                <div className="rounded-lg border border-white/10 bg-black/25 p-3">
                  <p className="uppercase tracking-wider text-arena-ash">Ativas</p>
                  <p className="mt-1 text-lg font-black text-green-300">{enabledCount}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/25 p-3">
                  <p className="uppercase tracking-wider text-arena-ash">Ocultas</p>
                  <p className="mt-1 text-lg font-black text-arena-smoke">{hiddenCount}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/25 p-3">
                  <p className="uppercase tracking-wider text-arena-ash">Destaques</p>
                  <p className="mt-1 text-lg font-black text-arena-gold">
                    {featuredCount}
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/25 p-3">
                  <p className="uppercase tracking-wider text-arena-ash">Sem imagem</p>
                  <p className="mt-1 text-lg font-black text-red-300">
                    {missingMediaCount}
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="p-10 text-center text-arena-smoke/60">
                  A carregar ofertas...
                </div>
              ) : sortedOffers.length === 0 ? (
                <div className="p-10 text-center text-arena-smoke/60">
                  <p>Sem ofertas para o Arena dos Bónus ainda.</p>
                  <button
                    type="button"
                    onClick={addOffer}
                    className="mt-4 inline-flex items-center gap-2 text-arena-gold hover:underline"
                  >
                    <Plus size={16} />
                    Criar primeira oferta
                  </button>
                </div>
              ) : displayOffers.length === 0 ? (
                <div className="p-10 text-center text-arena-smoke/60">
                  <Filter size={24} className="mx-auto mb-3 text-arena-gold/70" />
                  Sem ofertas para estes filtros.
                </div>
              ) : (
                <>
                  <div className="divide-y divide-white/10">
                    {pageOffers.map((offer) => {
                      const manualIndex = sortedOffers.findIndex(
                        (item) => item.localKey === offer.localKey,
                      );
                      const selected = selectedOffer?.localKey === offer.localKey;

                      return (
                        <div
                          key={offer.localKey}
                          className={`grid grid-cols-[minmax(0,1fr)_auto] gap-3 p-3 transition-colors ${
                            selected ? "bg-arena-gold/[0.07]" : "hover:bg-white/[0.03]"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedKey(offer.localKey)}
                            className="flex min-w-0 items-center gap-3 text-left"
                          >
                            <MiniMedia offer={offer} />
                            <span className="min-w-0">
                              <span className="flex items-center gap-2">
                                <span className="truncate text-sm font-bold text-white">
                                  {offer.name || "Oferta sem nome"}
                                </span>
                                {offer.badge && (
                                  <span className="rounded border border-arena-gold/25 px-1.5 py-0.5 text-[9px] font-black text-arena-gold">
                                    {offer.badge}
                                  </span>
                                )}
                              </span>
                              <span className="mt-1 block truncate text-xs text-arena-smoke/65">
                                {offer.headline || "Sem headline"}
                              </span>
                              <span className="mt-1 flex flex-wrap gap-2 text-[10px] uppercase tracking-wider">
                                <span
                                  className={
                                    offer.visible ? "text-green-300" : "text-red-300"
                                  }
                                >
                                  {offer.visible ? "Ativa" : "Oculta"}
                                </span>
                                {offer.featured && (
                                  <span className="text-arena-gold">Destaque</span>
                                )}
                                <span className="text-arena-ash">
                                  #{manualIndex + 1}
                                </span>
                              </span>
                            </span>
                          </button>

                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => moveOffer(offer.localKey, -1)}
                              disabled={sortMode !== "manual" || manualIndex === 0}
                              className={ICON_BUTTON_CLASS}
                              title="Subir"
                            >
                              <ArrowUp size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveOffer(offer.localKey, 1)}
                              disabled={
                                sortMode !== "manual" ||
                                manualIndex === sortedOffers.length - 1
                              }
                              className={ICON_BUTTON_CLASS}
                              title="Descer"
                            >
                              <ArrowDown size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateOffer(offer.localKey, { visible: !offer.visible })
                              }
                              className={`${ICON_BUTTON_CLASS} ${
                                offer.visible ? "text-green-300" : "text-red-300"
                              }`}
                              title={offer.visible ? "Ocultar" : "Mostrar"}
                            >
                              {offer.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateOffer(offer.localKey, {
                                  featured: !offer.featured,
                                })
                              }
                              className={`${ICON_BUTTON_CLASS} ${
                                offer.featured ? "text-arena-gold" : ""
                              }`}
                              title={offer.featured ? "Remover destaque" : "Destacar"}
                            >
                              <Star
                                size={15}
                                fill={offer.featured ? "currentColor" : "none"}
                              />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteOffer(offer)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/30 text-red-300 hover:bg-red-500/10"
                              title="Apagar"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 p-4">
                    <p className="text-xs text-arena-smoke/60">
                      Página {safePage} de {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                        disabled={safePage <= 1}
                        className={ICON_BUTTON_CLASS}
                        title="Página anterior"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setPage((current) => Math.min(totalPages, current + 1))
                        }
                        disabled={safePage >= totalPages}
                        className={ICON_BUTTON_CLASS}
                        title="Página seguinte"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {selectedOffer ? (
              <>
                <section className="rounded-lg border border-white/10 bg-arena-charcoal/60">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4">
                    <div>
                      <h2 className="font-[family-name:var(--font-display)] text-sm uppercase tracking-widest text-arena-gold">
                        Editor da oferta
                      </h2>
                      <p className="mt-1 text-xs text-arena-smoke/50">
                        Edita apenas a oferta selecionada.
                      </p>
                    </div>
                    <a
                      href={`/go/${slugify(selectedOffer.slug || selectedOffer.name)}?site=${SITE_SLUG}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="rounded-lg border border-arena-gold/25 px-3 py-2 text-xs uppercase tracking-wider text-arena-gold hover:bg-arena-gold/10"
                    >
                      Abrir redirect
                    </a>
                  </div>

                  <div className="grid gap-4 p-4 lg:grid-cols-12">
                    <Field label="Nome *" className="lg:col-span-4">
                      <input
                        value={selectedOffer.name}
                        onChange={(event) => {
                          const name = event.target.value;
                          updateOffer(selectedOffer.localKey, {
                            name,
                            slug: selectedOffer.id
                              ? selectedOffer.slug
                              : slugify(name),
                          });
                        }}
                        className={INPUT_CLASS}
                        required
                      />
                    </Field>
                    <Field label="Slug *" className="lg:col-span-4">
                      <input
                        value={selectedOffer.slug}
                        onChange={(event) =>
                          updateOffer(selectedOffer.localKey, {
                            slug: slugify(event.target.value),
                          })
                        }
                        className={INPUT_CLASS}
                        required
                      />
                    </Field>
                    <Field label="Link afiliado *" className="lg:col-span-4">
                      <input
                        value={selectedOffer.affiliateUrl}
                        onChange={(event) =>
                          updateOffer(selectedOffer.localKey, {
                            affiliateUrl: event.target.value,
                          })
                        }
                        placeholder="https://..."
                        className={INPUT_CLASS}
                        required
                      />
                    </Field>

                    <Field label="Headline *" className="lg:col-span-6">
                      <input
                        value={selectedOffer.headline}
                        onChange={(event) =>
                          updateOffer(selectedOffer.localKey, {
                            headline: event.target.value,
                          })
                        }
                        placeholder="50 Free Spins no registo"
                        className={INPUT_CLASS}
                        required
                      />
                    </Field>
                    <Field label="Bónus" className="lg:col-span-3">
                      <input
                        value={selectedOffer.bonusValue}
                        onChange={(event) =>
                          updateOffer(selectedOffer.localKey, {
                            bonusValue: event.target.value,
                          })
                        }
                        placeholder="100% até 100€"
                        className={INPUT_CLASS}
                      />
                    </Field>
                    <Field label="Código" className="lg:col-span-3">
                      <input
                        value={selectedOffer.code}
                        onChange={(event) =>
                          updateOffer(selectedOffer.localKey, {
                            code: event.target.value,
                          })
                        }
                        className={INPUT_CLASS}
                      />
                    </Field>

                    <Field label="CTA desta oferta" className="lg:col-span-3">
                      <input
                        value={selectedOffer.offerCtaLabel}
                        onChange={(event) =>
                          updateOffer(selectedOffer.localKey, {
                            offerCtaLabel: event.target.value,
                          })
                        }
                        placeholder={site?.cta_label ?? ctaLabel}
                        className={INPUT_CLASS}
                      />
                    </Field>
                    <Field label="Free Spins" className="lg:col-span-3">
                      <input
                        value={selectedOffer.freeSpins}
                        onChange={(event) =>
                          updateOffer(selectedOffer.localKey, {
                            freeSpins: event.target.value,
                          })
                        }
                        className={INPUT_CLASS}
                      />
                    </Field>
                    <Field label="Depósito mínimo" className="lg:col-span-3">
                      <input
                        value={selectedOffer.minDeposit}
                        onChange={(event) =>
                          updateOffer(selectedOffer.localKey, {
                            minDeposit: event.target.value,
                          })
                        }
                        className={INPUT_CLASS}
                      />
                    </Field>
                    <Field label="Cashback" className="lg:col-span-3">
                      <input
                        value={selectedOffer.cashback}
                        onChange={(event) =>
                          updateOffer(selectedOffer.localKey, {
                            cashback: event.target.value,
                          })
                        }
                        className={INPUT_CLASS}
                      />
                    </Field>

                    <Field label="Banner URL" className="lg:col-span-6">
                      <input
                        value={selectedOffer.bannerUrl}
                        onChange={(event) =>
                          updateOffer(selectedOffer.localKey, {
                            bannerUrl: event.target.value,
                          })
                        }
                        placeholder="https://..."
                        className={INPUT_CLASS}
                      />
                    </Field>
                    <Field label="Logo URL" className="lg:col-span-6">
                      <input
                        value={selectedOffer.logoUrl}
                        onChange={(event) =>
                          updateOffer(selectedOffer.localKey, {
                            logoUrl: event.target.value,
                          })
                        }
                        placeholder="https://..."
                        className={INPUT_CLASS}
                      />
                    </Field>

                    <Field
                      label={`Zoom da imagem ${formatScale(selectedOffer.logoScale)}`}
                      className="lg:col-span-5"
                    >
                      <div className="grid grid-cols-[1fr_88px] gap-3">
                        <input
                          type="range"
                          min="0.5"
                          max="2"
                          step="0.05"
                          value={clampLogoScale(selectedOffer.logoScale)}
                          onChange={(event) =>
                            updateOffer(selectedOffer.localKey, {
                              logoScale: event.target.value,
                            })
                          }
                          className="h-10 accent-arena-gold"
                        />
                        <input
                          type="number"
                          min="0.5"
                          max="2"
                          step="0.05"
                          value={selectedOffer.logoScale}
                          onChange={(event) =>
                            updateOffer(selectedOffer.localKey, {
                              logoScale: event.target.value,
                            })
                          }
                          onBlur={() =>
                            updateOffer(selectedOffer.localKey, {
                              logoScale: String(clampLogoScale(selectedOffer.logoScale)),
                            })
                          }
                          className={INPUT_CLASS}
                        />
                      </div>
                    </Field>
                    <Field label="Cor fallback" className="lg:col-span-2">
                      <input
                        type="color"
                        value={selectedOffer.logoBg || "#666666"}
                        onChange={(event) =>
                          updateOffer(selectedOffer.localKey, {
                            logoBg: event.target.value,
                          })
                        }
                        className="h-10 w-full rounded-lg border border-white/10 bg-arena-iron/70 px-1 py-1"
                      />
                    </Field>
                    <Field label="Badge" className="lg:col-span-2">
                      <select
                        value={selectedOffer.badge}
                        onChange={(event) =>
                          updateOffer(selectedOffer.localKey, {
                            badge: event.target.value as EditableOffer["badge"],
                          })
                        }
                        className={SELECT_CLASS}
                      >
                        <option value="">Nenhum</option>
                        <option value="NEW">NEW</option>
                        <option value="HOT">HOT</option>
                        <option value="TOP">TOP</option>
                      </select>
                    </Field>
                    <Field label="Rating" className="lg:col-span-3">
                      <input
                        type="number"
                        min="0"
                        max="5"
                        step="0.1"
                        value={selectedOffer.rating}
                        onChange={(event) =>
                          updateOffer(selectedOffer.localKey, {
                            rating: event.target.value,
                          })
                        }
                        className={INPUT_CLASS}
                      />
                    </Field>

                    <Field label="Levantamento" className="lg:col-span-4">
                      <input
                        value={selectedOffer.withdrawTime}
                        onChange={(event) =>
                          updateOffer(selectedOffer.localKey, {
                            withdrawTime: event.target.value,
                          })
                        }
                        className={INPUT_CLASS}
                      />
                    </Field>
                    <Field label="Licença" className="lg:col-span-4">
                      <input
                        value={selectedOffer.license}
                        onChange={(event) =>
                          updateOffer(selectedOffer.localKey, {
                            license: event.target.value,
                          })
                        }
                        className={INPUT_CLASS}
                      />
                    </Field>
                    <Field label="Fundado" className="lg:col-span-4">
                      <input
                        value={selectedOffer.established}
                        onChange={(event) =>
                          updateOffer(selectedOffer.localKey, {
                            established: event.target.value,
                          })
                        }
                        className={INPUT_CLASS}
                      />
                    </Field>

                    <div className="flex flex-wrap gap-4 lg:col-span-12">
                      <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-arena-smoke">
                        <input
                          type="checkbox"
                          checked={selectedOffer.visible}
                          onChange={(event) =>
                            updateOffer(selectedOffer.localKey, {
                              visible: event.target.checked,
                            })
                          }
                          className="h-4 w-4 accent-arena-gold"
                        />
                        Mostrar no Arena
                      </label>
                      <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-arena-smoke">
                        <input
                          type="checkbox"
                          checked={selectedOffer.featured}
                          onChange={(event) =>
                            updateOffer(selectedOffer.localKey, {
                              featured: event.target.checked,
                            })
                          }
                          className="h-4 w-4 accent-arena-gold"
                        />
                        Destacar
                      </label>
                    </div>

                    <Field label="Tags" className="lg:col-span-6">
                      <textarea
                        value={selectedOffer.tags}
                        onChange={(event) =>
                          updateOffer(selectedOffer.localKey, {
                            tags: event.target.value,
                          })
                        }
                        placeholder="Uma por linha ou separadas por vírgula"
                        className={TEXTAREA_CLASS}
                      />
                    </Field>
                    <Field label="Notas" className="lg:col-span-6">
                      <textarea
                        value={selectedOffer.notes}
                        onChange={(event) =>
                          updateOffer(selectedOffer.localKey, {
                            notes: event.target.value,
                          })
                        }
                        placeholder="Uma por linha"
                        className={TEXTAREA_CLASS}
                      />
                    </Field>
                  </div>
                </section>

                <section className="rounded-lg border border-arena-gold/20 bg-arena-charcoal/60 p-4">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="font-[family-name:var(--font-display)] text-sm uppercase tracking-widest text-arena-gold">
                        Preview no Arena dos Bónus
                      </h2>
                      <p className="mt-1 text-xs text-arena-smoke/50">
                        A imagem usa o mesmo zoom que será enviado ao widget.
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs uppercase tracking-wider text-arena-smoke">
                      <ImageIcon size={14} />
                      {formatScale(selectedOffer.logoScale)}
                    </div>
                  </div>
                  <div className="mx-auto max-w-sm">
                    <OfferPreview offer={selectedOffer} defaultCta={ctaLabel} />
                  </div>
                </section>
              </>
            ) : (
              <section className="rounded-lg border border-white/10 bg-arena-charcoal/60 p-10 text-center text-arena-smoke/60">
                Seleciona ou cria uma oferta para editar.
              </section>
            )}

            {dirtyCount > 0 && (
              <p className="text-xs text-red-300/80">
                {dirtyCount} oferta(s) marcadas para apagar quando gravares.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
