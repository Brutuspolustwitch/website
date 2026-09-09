"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
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

const SITE_SLUG = DEFAULT_EXTERNAL_OFFER_SITE.slug;

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

function normalizeOrder(offers: EditableOffer[]) {
  return offers.map((offer, index) => ({ ...offer, sortOrder: index }));
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
    rating: "5",
    visible: true,
    featured: false,
    sortOrder: nextOrder,
  };
}

export default function ExternalSitesAdminPage() {
  const [site, setSite] = useState<ExternalOfferSiteRow | null>(null);
  const [offers, setOffers] = useState<EditableOffer[]>([]);
  const [deletedOfferIds, setDeletedOfferIds] = useState<string[]>([]);
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

  const enabledCount = sortedOffers.filter((offer) => offer.visible).length;

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    const res = await fetch(`/api/admin/external-offers?site=${SITE_SLUG}`, {
      cache: "no-store",
    });
    const data = (await res.json()) as ApiResponse;

    if (!res.ok || data.error) {
      setMessage({
        ok: false,
        text: data.error ?? "Erro ao carregar site externo.",
      });
      setLoading(false);
      return;
    }

    if (data.site) {
      setSite(data.site);
      setTitle(data.site.title);
      setDescription(data.site.description);
      setCtaLabel(data.site.cta_label);
      setIsActive(data.site.is_active);
    }
    setOffers(normalizeOrder((data.offers ?? []).map(toEditableOffer)));
    setDeletedOfferIds([]);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [load]);

  function updateOffer(localKey: string, patch: Partial<EditableOffer>) {
    setOffers((current) =>
      current.map((offer) =>
        offer.localKey === localKey ? { ...offer, ...patch } : offer,
      ),
    );
  }

  function addOffer() {
    setOffers((current) => [...current, createEmptyOffer(current.length)]);
  }

  function deleteOffer(offer: EditableOffer) {
    if (!confirm(`Apagar a oferta "${offer.name || "sem nome"}"?`)) return;

    setOffers((current) =>
      normalizeOrder(current.filter((item) => item.localKey !== offer.localKey)),
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
      setOffers(normalizeOrder((data.offers ?? []).map(toEditableOffer)));
      setDeletedOfferIds([]);
      setMessage({ ok: true, text: "Arena dos Bónus atualizada." });
    } catch (error) {
      const text =
        error instanceof Error ? error.message : "Erro ao guardar alterações.";
      setMessage({ ok: false, text });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-arena-smoke/50">
              Sites Externos
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-2xl text-arena-gold tracking-wide mt-1">
              Arena dos Bónus
            </h1>
            <p className="text-sm text-arena-smoke/60 mt-2 max-w-2xl">
              Controla uma lista de ofertas própria para o Arena dos Bónus. Esta
              lista não altera as parcerias que aparecem no Brutuspolus.
            </p>
          </div>
          <button
            type="button"
            onClick={addOffer}
            disabled={loading}
            className="px-5 py-2.5 rounded-lg bg-arena-gold/15 border border-arena-gold/35 text-arena-gold text-xs uppercase tracking-wider font-bold hover:bg-arena-gold/25 disabled:opacity-50 transition-colors"
          >
            + Nova Oferta
          </button>
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

        <section className="rounded-xl bg-arena-charcoal/60 border border-arena-gold/20 p-5">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-arena-gold text-sm tracking-widest uppercase">
                Ligação ao site
              </h2>
              <p className="text-xs text-arena-smoke/50 mt-1">
                {enabledCount} ofertas ativas no feed.
              </p>
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-arena-smoke cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
                className="w-4 h-4 accent-arena-gold"
              />
              Site ativo
            </label>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <label className="space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-arena-ash">
                Título
              </span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full bg-arena-iron/70 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-arena-gold/50"
              />
            </label>
            <label className="md:col-span-2 space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-arena-ash">
                Descrição
              </span>
              <input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="w-full bg-arena-iron/70 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-arena-gold/50"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-arena-ash">
                CTA padrão
              </span>
              <input
                value={ctaLabel}
                onChange={(event) => setCtaLabel(event.target.value)}
                className="w-full bg-arena-iron/70 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-arena-gold/50"
              />
            </label>
            <div className="md:col-span-2 grid sm:grid-cols-2 gap-3">
              <div className="rounded-lg bg-black/30 border border-white/10 p-3 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] uppercase tracking-wider text-arena-ash">
                    API
                  </span>
                  <button
                    type="button"
                    onClick={() => copy(apiUrl)}
                    className="text-[10px] uppercase tracking-wider text-arena-gold hover:underline"
                  >
                    Copiar
                  </button>
                </div>
                <code className="block text-xs text-arena-smoke/70 break-all">
                  {apiUrl}
                </code>
              </div>
              <div className="rounded-lg bg-black/30 border border-white/10 p-3 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] uppercase tracking-wider text-arena-ash">
                    Widget
                  </span>
                  <button
                    type="button"
                    onClick={() => copy(embedSnippet)}
                    className="text-[10px] uppercase tracking-wider text-arena-gold hover:underline"
                  >
                    Copiar
                  </button>
                </div>
                <code className="block text-xs text-arena-smoke/70 whitespace-pre-wrap break-all">
                  {embedSnippet}
                </code>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl bg-arena-charcoal/60 border border-white/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-arena-gold text-sm tracking-widest uppercase">
                Ofertas próprias do Arena
              </h2>
              <p className="text-xs text-arena-smoke/50 mt-1">
                Estes dados só alimentam arenadosbonus.com.
              </p>
            </div>
            <button
              type="button"
              onClick={save}
              disabled={saving || loading}
              className="px-5 py-2.5 rounded-lg bg-arena-gold/15 border border-arena-gold/35 text-arena-gold text-xs uppercase tracking-wider font-bold hover:bg-arena-gold/25 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "A guardar..." : "Guardar"}
            </button>
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
                className="mt-4 text-arena-gold hover:underline"
              >
                Criar primeira oferta
              </button>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {sortedOffers.map((offer, index) => (
                <div
                  key={offer.localKey}
                  className={`p-4 grid gap-4 xl:grid-cols-[74px_180px_minmax(0,1fr)] ${
                    offer.visible
                      ? "bg-arena-dark/70"
                      : "bg-arena-dark/35 opacity-70"
                  }`}
                >
                  <div className="flex xl:flex-col items-center justify-start gap-2">
                    <button
                      type="button"
                      onClick={() => moveOffer(offer.localKey, -1)}
                      disabled={index === 0}
                      className="w-8 h-8 rounded border border-white/10 text-arena-smoke hover:text-arena-gold hover:border-arena-gold/30 disabled:opacity-25"
                      aria-label="Subir oferta"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => moveOffer(offer.localKey, 1)}
                      disabled={index === sortedOffers.length - 1}
                      className="w-8 h-8 rounded border border-white/10 text-arena-smoke hover:text-arena-gold hover:border-arena-gold/30 disabled:opacity-25"
                      aria-label="Descer oferta"
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteOffer(offer)}
                      className="w-8 h-8 rounded border border-red-500/30 text-red-300 hover:bg-red-500/10"
                      aria-label="Apagar oferta"
                    >
                      ×
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div
                      className="h-24 rounded-lg border border-white/10 overflow-hidden flex items-center justify-center text-white text-4xl font-bold"
                      style={{ backgroundColor: offer.logoBg || "#666666" }}
                    >
                      {canPreviewImage(offer.bannerUrl) ? (
                        <Image
                          src={offer.bannerUrl.trim()}
                          alt=""
                          width={320}
                          height={180}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : canPreviewImage(offer.logoUrl) ? (
                        <Image
                          src={offer.logoUrl.trim()}
                          alt=""
                          width={160}
                          height={90}
                          className="max-w-full max-h-full object-contain"
                          unoptimized
                        />
                      ) : (
                        offer.name.slice(0, 1) || "?"
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <label className="inline-flex items-center gap-2 cursor-pointer text-arena-smoke">
                        <input
                          type="checkbox"
                          checked={offer.visible}
                          onChange={(event) =>
                            updateOffer(offer.localKey, {
                              visible: event.target.checked,
                            })
                          }
                          className="w-4 h-4 accent-arena-gold"
                        />
                        Mostrar
                      </label>
                      <label className="inline-flex items-center gap-2 cursor-pointer text-arena-smoke">
                        <input
                          type="checkbox"
                          checked={offer.featured}
                          onChange={(event) =>
                            updateOffer(offer.localKey, {
                              featured: event.target.checked,
                            })
                          }
                          className="w-4 h-4 accent-arena-gold"
                        />
                        Destacar
                      </label>
                    </div>
                    <a
                      href={`/go/${slugify(offer.slug || offer.name)}?site=${SITE_SLUG}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="block truncate bg-arena-iron/70 border border-white/10 rounded-lg px-3 py-2 text-xs text-arena-gold hover:border-arena-gold/40"
                    >
                      /go/{slugify(offer.slug || offer.name)}?site={SITE_SLUG}
                    </a>
                  </div>

                  <div className="grid md:grid-cols-4 gap-3">
                    <label className="space-y-1">
                      <span className="text-[11px] uppercase tracking-wider text-arena-ash">
                        Nome *
                      </span>
                      <input
                        value={offer.name}
                        onChange={(event) => {
                          const name = event.target.value;
                          updateOffer(offer.localKey, {
                            name,
                            slug: offer.id ? offer.slug : slugify(name),
                          });
                        }}
                        className="w-full bg-arena-iron/70 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-arena-gold/50"
                        required
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[11px] uppercase tracking-wider text-arena-ash">
                        Slug *
                      </span>
                      <input
                        value={offer.slug}
                        onChange={(event) =>
                          updateOffer(offer.localKey, {
                            slug: slugify(event.target.value),
                          })
                        }
                        className="w-full bg-arena-iron/70 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-arena-gold/50"
                        required
                      />
                    </label>
                    <label className="space-y-1 md:col-span-2">
                      <span className="text-[11px] uppercase tracking-wider text-arena-ash">
                        Link afiliado *
                      </span>
                      <input
                        value={offer.affiliateUrl}
                        onChange={(event) =>
                          updateOffer(offer.localKey, {
                            affiliateUrl: event.target.value,
                          })
                        }
                        placeholder="https://..."
                        className="w-full bg-arena-iron/70 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-arena-smoke/35 focus:outline-none focus:border-arena-gold/50"
                        required
                      />
                    </label>

                    <label className="space-y-1 md:col-span-2">
                      <span className="text-[11px] uppercase tracking-wider text-arena-ash">
                        Headline *
                      </span>
                      <input
                        value={offer.headline}
                        onChange={(event) =>
                          updateOffer(offer.localKey, {
                            headline: event.target.value,
                          })
                        }
                        placeholder="50 Free Spins no registo"
                        className="w-full bg-arena-iron/70 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-arena-smoke/35 focus:outline-none focus:border-arena-gold/50"
                        required
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[11px] uppercase tracking-wider text-arena-ash">
                        Bónus
                      </span>
                      <input
                        value={offer.bonusValue}
                        onChange={(event) =>
                          updateOffer(offer.localKey, {
                            bonusValue: event.target.value,
                          })
                        }
                        placeholder="100% até 100€"
                        className="w-full bg-arena-iron/70 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-arena-smoke/35 focus:outline-none focus:border-arena-gold/50"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[11px] uppercase tracking-wider text-arena-ash">
                        Código
                      </span>
                      <input
                        value={offer.code}
                        onChange={(event) =>
                          updateOffer(offer.localKey, {
                            code: event.target.value,
                          })
                        }
                        className="w-full bg-arena-iron/70 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-arena-gold/50"
                      />
                    </label>

                    <label className="space-y-1">
                      <span className="text-[11px] uppercase tracking-wider text-arena-ash">
                        CTA desta oferta
                      </span>
                      <input
                        value={offer.offerCtaLabel}
                        onChange={(event) =>
                          updateOffer(offer.localKey, {
                            offerCtaLabel: event.target.value,
                          })
                        }
                        placeholder={site?.cta_label ?? ctaLabel}
                        className="w-full bg-arena-iron/70 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-arena-smoke/35 focus:outline-none focus:border-arena-gold/50"
                      />
                    </label>

                    <label className="space-y-1">
                      <span className="text-[11px] uppercase tracking-wider text-arena-ash">
                        Free Spins
                      </span>
                      <input
                        value={offer.freeSpins}
                        onChange={(event) =>
                          updateOffer(offer.localKey, {
                            freeSpins: event.target.value,
                          })
                        }
                        className="w-full bg-arena-iron/70 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-arena-gold/50"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[11px] uppercase tracking-wider text-arena-ash">
                        Depósito mínimo
                      </span>
                      <input
                        value={offer.minDeposit}
                        onChange={(event) =>
                          updateOffer(offer.localKey, {
                            minDeposit: event.target.value,
                          })
                        }
                        className="w-full bg-arena-iron/70 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-arena-gold/50"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[11px] uppercase tracking-wider text-arena-ash">
                        Cashback
                      </span>
                      <input
                        value={offer.cashback}
                        onChange={(event) =>
                          updateOffer(offer.localKey, {
                            cashback: event.target.value,
                          })
                        }
                        className="w-full bg-arena-iron/70 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-arena-gold/50"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[11px] uppercase tracking-wider text-arena-ash">
                        Rating
                      </span>
                      <input
                        type="number"
                        min="0"
                        max="5"
                        step="0.1"
                        value={offer.rating}
                        onChange={(event) =>
                          updateOffer(offer.localKey, {
                            rating: event.target.value,
                          })
                        }
                        className="w-full bg-arena-iron/70 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-arena-gold/50"
                      />
                    </label>

                    <label className="space-y-1 md:col-span-2">
                      <span className="text-[11px] uppercase tracking-wider text-arena-ash">
                        Banner URL
                      </span>
                      <input
                        value={offer.bannerUrl}
                        onChange={(event) =>
                          updateOffer(offer.localKey, {
                            bannerUrl: event.target.value,
                          })
                        }
                        placeholder="https://..."
                        className="w-full bg-arena-iron/70 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-arena-smoke/35 focus:outline-none focus:border-arena-gold/50"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[11px] uppercase tracking-wider text-arena-ash">
                        Logo URL
                      </span>
                      <input
                        value={offer.logoUrl}
                        onChange={(event) =>
                          updateOffer(offer.localKey, {
                            logoUrl: event.target.value,
                          })
                        }
                        className="w-full bg-arena-iron/70 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-arena-gold/50"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[11px] uppercase tracking-wider text-arena-ash">
                        Cor fallback
                      </span>
                      <input
                        type="color"
                        value={offer.logoBg || "#666666"}
                        onChange={(event) =>
                          updateOffer(offer.localKey, {
                            logoBg: event.target.value,
                          })
                        }
                        className="w-full h-10 bg-arena-iron/70 border border-white/10 rounded-lg px-1 py-1"
                      />
                    </label>

                    <label className="space-y-1">
                      <span className="text-[11px] uppercase tracking-wider text-arena-ash">
                        Badge
                      </span>
                      <select
                        value={offer.badge}
                        onChange={(event) =>
                          updateOffer(offer.localKey, {
                            badge: event.target.value as EditableOffer["badge"],
                          })
                        }
                        className="w-full bg-arena-iron/70 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-arena-gold/50"
                      >
                        <option value="">Nenhum</option>
                        <option value="NEW">NEW</option>
                        <option value="HOT">HOT</option>
                        <option value="TOP">TOP</option>
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="text-[11px] uppercase tracking-wider text-arena-ash">
                        Levantamento
                      </span>
                      <input
                        value={offer.withdrawTime}
                        onChange={(event) =>
                          updateOffer(offer.localKey, {
                            withdrawTime: event.target.value,
                          })
                        }
                        className="w-full bg-arena-iron/70 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-arena-gold/50"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[11px] uppercase tracking-wider text-arena-ash">
                        Licença
                      </span>
                      <input
                        value={offer.license}
                        onChange={(event) =>
                          updateOffer(offer.localKey, {
                            license: event.target.value,
                          })
                        }
                        className="w-full bg-arena-iron/70 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-arena-gold/50"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[11px] uppercase tracking-wider text-arena-ash">
                        Fundado
                      </span>
                      <input
                        value={offer.established}
                        onChange={(event) =>
                          updateOffer(offer.localKey, {
                            established: event.target.value,
                          })
                        }
                        className="w-full bg-arena-iron/70 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-arena-gold/50"
                      />
                    </label>

                    <label className="space-y-1 md:col-span-2">
                      <span className="text-[11px] uppercase tracking-wider text-arena-ash">
                        Tags
                      </span>
                      <textarea
                        value={offer.tags}
                        onChange={(event) =>
                          updateOffer(offer.localKey, {
                            tags: event.target.value,
                          })
                        }
                        placeholder="Uma por linha ou separadas por vírgula"
                        className="w-full min-h-20 bg-arena-iron/70 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-arena-smoke/35 focus:outline-none focus:border-arena-gold/50"
                      />
                    </label>
                    <label className="space-y-1 md:col-span-2">
                      <span className="text-[11px] uppercase tracking-wider text-arena-ash">
                        Notas
                      </span>
                      <textarea
                        value={offer.notes}
                        onChange={(event) =>
                          updateOffer(offer.localKey, {
                            notes: event.target.value,
                          })
                        }
                        placeholder="Uma por linha"
                        className="w-full min-h-20 bg-arena-iron/70 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-arena-smoke/35 focus:outline-none focus:border-arena-gold/50"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
