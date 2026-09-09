"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { CasinoOfferRow, ExternalOfferSiteRow } from "@/lib/supabase";
import { DEFAULT_EXTERNAL_OFFER_SITE } from "@/lib/externalOfferSites";

type ExternalCasinoOffer = Omit<CasinoOfferRow, "is_exclusive"> & {
  is_exclusive?: boolean;
};

type ExternalOfferAdminItem = {
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

type ApiResponse = {
  site?: ExternalOfferSiteRow;
  items?: ExternalOfferAdminItem[];
  error?: string;
};

const SITE_SLUG = DEFAULT_EXTERNAL_OFFER_SITE.slug;

function getPublicOrigin() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://www.brutuspolus.com"
  );
}

function normalizeOrder(items: ExternalOfferAdminItem[]) {
  return items.map((item, index) => ({ ...item, sort_order: index }));
}

export default function ExternalSitesAdminPage() {
  const [site, setSite] = useState<ExternalOfferSiteRow | null>(null);
  const [items, setItems] = useState<ExternalOfferAdminItem[]>([]);
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

  const sortedItems = useMemo(
    () =>
      [...items].sort(
        (a, b) =>
          a.sort_order - b.sort_order || a.offer.name.localeCompare(b.offer.name),
      ),
    [items],
  );

  const enabledCount = sortedItems.filter(
    (item) => item.visible && item.offer.visible,
  ).length;

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
    setItems(normalizeOrder(data.items ?? []));
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [load]);

  function updateItem(
    offerId: string,
    patch: Partial<ExternalOfferAdminItem>,
  ) {
    setItems((current) =>
      current.map((item) =>
        item.offer_id === offerId ? { ...item, ...patch } : item,
      ),
    );
  }

  function moveItem(offerId: string, direction: -1 | 1) {
    setItems((current) => {
      const ordered = normalizeOrder(
        [...current].sort(
          (a, b) =>
            a.sort_order - b.sort_order ||
            a.offer.name.localeCompare(b.offer.name),
        ),
      );
      const index = ordered.findIndex((item) => item.offer_id === offerId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= ordered.length) {
        return current;
      }

      const [item] = ordered.splice(index, 1);
      ordered.splice(nextIndex, 0, item);
      return normalizeOrder(ordered);
    });
  }

  async function copy(text: string) {
    await navigator.clipboard?.writeText(text);
    setMessage({ ok: true, text: "Copiado." });
  }

  async function save() {
    setSaving(true);
    setMessage(null);

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
        items: normalizeOrder(sortedItems).map((item) => ({
          offerId: item.offer_id,
          visible: item.visible,
          featured: item.featured,
          sortOrder: item.sort_order,
          customHeadline: item.custom_headline,
          customBonusValue: item.custom_bonus_value,
          customCtaLabel: item.custom_cta_label,
        })),
      }),
    });
    const data = (await res.json()) as ApiResponse;

    if (!res.ok || data.error) {
      setMessage({
        ok: false,
        text: data.error ?? "Erro ao guardar alterações.",
      });
      setSaving(false);
      return;
    }

    if (data.site) {
      setSite(data.site);
      setTitle(data.site.title);
      setDescription(data.site.description);
      setCtaLabel(data.site.cta_label);
      setIsActive(data.site.is_active);
    }
    setItems(normalizeOrder(data.items ?? []));
    setMessage({ ok: true, text: "Arena dos Bónus atualizada." });
    setSaving(false);
  }

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-arena-smoke/50">
              Sites Externos
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-2xl text-arena-gold tracking-wide mt-1">
              Arena dos Bónus
            </h1>
            <p className="text-sm text-arena-smoke/60 mt-2 max-w-2xl">
              Controla as ofertas que aparecem no site externo. As alterações
              saem pela API pública e pelo widget JavaScript.
            </p>
          </div>
          <Link
            href="/admin/parcerias"
            className="px-4 py-2 rounded-lg border border-arena-gold/25 text-arena-gold text-xs uppercase tracking-wider hover:bg-arena-gold/10 transition-colors"
          >
            Editar Parcerias
          </Link>
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
                Ofertas no Arena dos Bónus
              </h2>
              <p className="text-xs text-arena-smoke/50 mt-1">
                A ordem aqui é a ordem no site externo.
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
          ) : sortedItems.length === 0 ? (
            <div className="p-10 text-center text-arena-smoke/60">
              Sem parcerias criadas ainda.
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {sortedItems.map((item, index) => (
                <div
                  key={item.offer_id}
                  className={`p-4 grid gap-4 lg:grid-cols-[74px_minmax(190px,1fr)_minmax(260px,1.4fr)] ${
                    item.visible && item.offer.visible
                      ? "bg-arena-dark/70"
                      : "bg-arena-dark/35 opacity-70"
                  }`}
                >
                  <div className="flex lg:flex-col items-center justify-start gap-2">
                    <button
                      type="button"
                      onClick={() => moveItem(item.offer_id, -1)}
                      disabled={index === 0}
                      className="w-8 h-8 rounded border border-white/10 text-arena-smoke hover:text-arena-gold hover:border-arena-gold/30 disabled:opacity-25"
                      aria-label="Subir oferta"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(item.offer_id, 1)}
                      disabled={index === sortedItems.length - 1}
                      className="w-8 h-8 rounded border border-white/10 text-arena-smoke hover:text-arena-gold hover:border-arena-gold/30 disabled:opacity-25"
                      aria-label="Descer oferta"
                    >
                      ▼
                    </button>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-lg shrink-0 overflow-hidden border border-white/10 flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: item.offer.logo_bg }}
                      >
                        {item.offer.logo_url ? (
                          <Image
                            src={item.offer.logo_url}
                            alt=""
                            width={48}
                            height={48}
                            className="w-full h-full object-contain"
                            unoptimized
                          />
                        ) : (
                          item.offer.name.slice(0, 1)
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-white font-bold truncate">
                          {item.offer.name}
                        </h3>
                        <p className="text-xs text-arena-smoke/60 truncate">
                          {item.offer.headline} {item.offer.bonus_value}
                        </p>
                        {!item.offer.visible && (
                          <p className="text-[11px] text-red-300 mt-1">
                            Oculta nas parcerias Brutuspolus.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-4 flex-wrap text-sm">
                      <label className="inline-flex items-center gap-2 cursor-pointer text-arena-smoke">
                        <input
                          type="checkbox"
                          checked={item.visible}
                          onChange={(event) =>
                            updateItem(item.offer_id, {
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
                          checked={item.featured}
                          onChange={(event) =>
                            updateItem(item.offer_id, {
                              featured: event.target.checked,
                            })
                          }
                          className="w-4 h-4 accent-arena-gold"
                        />
                        Destacar
                      </label>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3">
                    <label className="space-y-1 sm:col-span-3">
                      <span className="text-[11px] uppercase tracking-wider text-arena-ash">
                        Headline neste site
                      </span>
                      <input
                        value={item.custom_headline ?? ""}
                        placeholder={item.offer.headline}
                        onChange={(event) =>
                          updateItem(item.offer_id, {
                            custom_headline: event.target.value,
                          })
                        }
                        className="w-full bg-arena-iron/70 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-arena-smoke/35 focus:outline-none focus:border-arena-gold/50"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[11px] uppercase tracking-wider text-arena-ash">
                        Bónus
                      </span>
                      <input
                        value={item.custom_bonus_value ?? ""}
                        placeholder={item.offer.bonus_value}
                        onChange={(event) =>
                          updateItem(item.offer_id, {
                            custom_bonus_value: event.target.value,
                          })
                        }
                        className="w-full bg-arena-iron/70 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-arena-smoke/35 focus:outline-none focus:border-arena-gold/50"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[11px] uppercase tracking-wider text-arena-ash">
                        CTA
                      </span>
                      <input
                        value={item.custom_cta_label ?? ""}
                        placeholder={site?.cta_label ?? ctaLabel}
                        onChange={(event) =>
                          updateItem(item.offer_id, {
                            custom_cta_label: event.target.value,
                          })
                        }
                        className="w-full bg-arena-iron/70 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-arena-smoke/35 focus:outline-none focus:border-arena-gold/50"
                      />
                    </label>
                    <div className="space-y-1">
                      <span className="text-[11px] uppercase tracking-wider text-arena-ash">
                        Link
                      </span>
                      <a
                        href={`/go/${item.offer.slug}`}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="block truncate bg-arena-iron/70 border border-white/10 rounded-lg px-3 py-2 text-sm text-arena-gold hover:border-arena-gold/40"
                      >
                        /go/{item.offer.slug}
                      </a>
                    </div>
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
