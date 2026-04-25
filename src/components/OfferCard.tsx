"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { CasinoOfferRow } from "@/lib/supabase";
import { trackOfferClick } from "@/lib/analytics/tracker";
import { WaxSealBadge } from "@/components/WaxSealBadge";

/* ═══════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════ */

export interface CasinoOffer {
  id: string;
  slug: string;
  name: string;
  logo_url?: string;
  logo_bg: string;
  banner_url?: string;
  badge?: "NEW" | "HOT" | "TOP";
  tags: string[];
  headline: string;
  bonus_value: string;
  free_spins: string;
  min_deposit: string;
  code: string;
  cashback?: string;
  withdraw_time: string;
  license: string;
  established: string;
  notes: string[];
  affiliate_url: string;
  rating: number;
  is_exclusive?: boolean;
}

/* ── Star Rating Component ──────────────────────────────── */
function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;

  return (
    <div className="rating-row">
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} className="star-icon" viewBox="0 0 24 24">
          {i < fullStars ? (
            <path
              className="star-filled"
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            />
          ) : i === fullStars && hasHalf ? (
            <>
              <defs>
                <linearGradient id={`halfGrad-${i}`}>
                  <stop offset="50%" stopColor="#d4a017" />
                  <stop offset="50%" stopColor="rgba(139,105,20,0.2)" />
                </linearGradient>
              </defs>
              <path
                fill={`url(#halfGrad-${i})`}
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              />
            </>
          ) : (
            <path
              className="star-empty"
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            />
          )}
        </svg>
      ))}
      <span className="rating-number">{rating.toFixed(1)}</span>
    </div>
  );
}

/* ── Corner Ornament SVG ────────────────────────────────── */
// (kept for potential reuse)

/* ═══════════════════════════════════════════════════════════════════
   STORE-STYLE OFFER CARD
   ═══════════════════════════════════════════════════════════════════ */

export function OfferCard({ offer }: { offer: CasinoOffer }) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = useCallback((e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(offer.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [offer.code]);

  const perks = offer.tags.length > 0 ? offer.tags : ["🎰 Slots", "⚡ Instant Play", "🛡 SSL"];
  const externalUrl = offer.affiliate_url.startsWith("http") ? offer.affiliate_url : `https://${offer.affiliate_url}`;

  return (
    <div className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden hover:border-arena-gold/30 transition-all duration-300 flex flex-col">

      {/* Banner */}
      {offer.banner_url && (
        <div className="aspect-video w-full overflow-hidden bg-white/[0.03] relative shrink-0">
          <img
            src={offer.banner_url}
            alt={offer.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {offer.badge && (
            <div className="absolute top-2 right-2">
              <WaxSealBadge text={offer.badge} variant={offer.badge === "TOP" ? "gold" : "red"} rotation={8} size={48} />
            </div>
          )}
        </div>
      )}

      <div className="p-5 flex flex-col gap-3 flex-1">

        {/* Name + logo + rating */}
        <div className="flex items-center gap-3">
          {offer.logo_url && (
            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0" style={{ background: offer.logo_bg || "#1a1a1a" }}>
              <img src={offer.logo_url} alt={offer.name} className="w-full h-full object-contain" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-lg leading-tight truncate">{offer.name}</h3>
            {offer.is_exclusive !== false && (
              <p className="text-[10px] text-arena-gold/70 uppercase tracking-widest font-bold">✦ Oferta Exclusiva</p>
            )}
          </div>
          <StarRating rating={offer.rating ?? 4.5} />
        </div>

        {/* Bonus highlight */}
        <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-2.5">
          <p className="text-sm text-white/60">{offer.headline}</p>
          <p className="text-base font-bold text-arena-gold mt-0.5">{offer.bonus_value}</p>
          {((offer.free_spins && offer.free_spins !== "—" && offer.free_spins.trim() !== "") || (offer.cashback && offer.cashback.trim() !== "")) && (
            <p className="text-xs text-white/40 mt-0.5">
              {offer.free_spins && offer.free_spins !== "—" && offer.free_spins.trim() !== "" ? `+ ${offer.free_spins} Free Spins` : ""}
              {offer.cashback && offer.cashback.trim() !== "" ? ` · ${offer.cashback} Cashback` : ""}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: "Depósito Mín.", value: offer.min_deposit },
            { label: "Levantamento", value: offer.withdraw_time },
            { label: "Licença", value: offer.license },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg bg-white/[0.03] border border-white/[0.05] px-2 py-1.5">
              <p className="text-[9px] uppercase tracking-wider text-white/30 font-semibold leading-none">{label}</p>
              <p className="text-xs text-white/70 font-medium mt-1 truncate">{value}</p>
            </div>
          ))}
        </div>

        {/* Perks/tags */}
        <div className="flex flex-wrap gap-1.5">
          {perks.map((perk) => (
            <span key={perk} className="text-[11px] rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-0.5 text-white/50">{perk}</span>
          ))}
        </div>

        {/* Promo code */}
        {offer.code && offer.code !== "—" && (
          <button
            className="flex items-center gap-2 rounded-lg border border-arena-gold/20 bg-arena-gold/[0.06] px-3 py-2 w-full text-left hover:bg-arena-gold/[0.1] transition-colors"
            onClick={handleCopyCode}
          >
            <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Código</span>
            <span className="font-mono font-bold text-arena-gold text-sm flex-1">{offer.code}</span>
            <span className="text-[10px] text-white/30">{copied ? "✓ Copiado" : "Copiar"}</span>
          </button>
        )}

        {/* Notes */}
        {offer.notes && offer.notes.length > 0 && (
          <div className="space-y-0.5">
            {offer.notes.map((note, idx) => (
              <p key={idx} className="text-[10px] uppercase tracking-wide text-white/25 font-semibold">{note}</p>
            ))}
          </div>
        )}

        {/* CTA — kept as-is */}
        <div className="mt-auto pt-1">
          <a href={externalUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => { e.stopPropagation(); trackOfferClick(offer.id, offer.name); }}>
            <button className="cta-button w-full">⚔ Resgatar Bónus ⚔</button>
          </a>
          <p className="text-[10px] text-white/25 text-center mt-1.5">18+ · T&Cs Aplicáveis · Joga com responsabilidade</p>
        </div>

      </div>

      {/* Copy toast */}
      {copied && (
        <div className="absolute inset-x-0 bottom-4 flex justify-center pointer-events-none">
          <span className="rounded-full bg-arena-gold/20 border border-arena-gold/30 px-4 py-1.5 text-xs font-semibold text-arena-gold">✦ Código copiado ✦</span>
        </div>
      )}
    </div>
  );
}

export function OfferCards({ emptyClassName = "" }: { emptyClassName?: string }) {
  const [offers, setOffers] = useState<CasinoOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("casino_offers")
        .select("*")
        .eq("visible", true)
        .order("sort_order", { ascending: true });
      if (!error && data) {
        setOffers(
          (data as CasinoOfferRow[]).map((r) => ({
            id: r.id,
            slug: r.slug,
            name: r.name,
            logo_url: r.logo_url ?? undefined,
            logo_bg: r.logo_bg,
            banner_url: r.banner_url ?? undefined,
            badge: r.badge ?? undefined,
            tags: r.tags,
            headline: r.headline,
            bonus_value: r.bonus_value,
            free_spins: r.free_spins,
            min_deposit: r.min_deposit,
            code: r.code,
            cashback: r.cashback ?? undefined,
            withdraw_time: r.withdraw_time,
            license: r.license,
            established: r.established,
            notes: r.notes,
            affiliate_url: r.affiliate_url,
            rating: r.rating ?? 4.5,
            is_exclusive: r.is_exclusive ?? true,
          }))
        );
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="text-center text-arena-ash py-12">A carregar ofertas...</div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className={`text-center text-arena-ash py-12 ${emptyClassName}`}>
        <p className="text-lg">Nenhuma oferta disponível de momento.</p>
        <p className="text-sm mt-2">Volta em breve para novas promoções!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
      {offers.map((offer) => (
        <OfferCard key={offer.slug} offer={offer} />
      ))}
    </div>
  );
}
