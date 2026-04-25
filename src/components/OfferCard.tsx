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
   PAPYRUS FLIP OFFER CARD
   ═══════════════════════════════════════════════════════════════════ */

const cardStyle: React.CSSProperties = {
  background: "linear-gradient(160deg, var(--parchment-light) 0%, var(--parchment-mid) 40%, var(--parchment-dark) 100%)",
  border: "2px solid var(--gold-dark)",
  boxShadow: "0 4px 20px rgba(139,105,20,0.18), inset 0 1px 0 rgba(255,255,255,0.4)",
};

export function OfferCard({ offer }: { offer: CasinoOffer }) {
  const [copied, setCopied] = useState(false);
  const [flipped, setFlipped] = useState(false);

  const handleCopyCode = useCallback((e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(offer.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [offer.code]);

  const perks = offer.tags.length > 0 ? offer.tags : ["🎰 Slots", "⚡ Instant Play", "🛡 SSL"];
  const externalUrl = offer.affiliate_url.startsWith("http") ? offer.affiliate_url : `https://${offer.affiliate_url}`;

  const ctaButton = (
    <a href={externalUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => { e.stopPropagation(); trackOfferClick(offer.id, offer.name); }}>
      <button className="cta-button w-full">⚔ Resgatar Bónus ⚔</button>
    </a>
  );

  return (
    <div className="papyrus-flip-container">
      <div className={`papyrus-flip-inner ${flipped ? "papyrus-flipped" : ""}`}>

        {/* ═══ FRONT ═══ */}
        <div className="papyrus-flip-face papyrus-flip-front">
          <div className="rounded-2xl overflow-hidden flex flex-col h-full" style={cardStyle}>

            {/* Banner */}
            {offer.banner_url && (
              <div className="w-full h-36 shrink-0 overflow-hidden relative">
                <img src={offer.banner_url} alt={offer.name} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                {/* Bottom fade into card */}
                <div className="absolute inset-x-0 bottom-0 h-16 pointer-events-none" style={{ background: "linear-gradient(to bottom, transparent, var(--parchment-light))" }} />
                {offer.badge && (
                  <div className="absolute top-2 right-2 z-10">
                    <WaxSealBadge text={offer.badge} variant={offer.badge === "TOP" ? "gold" : "red"} rotation={8} size={48} />
                  </div>
                )}
              </div>
            )}

            <div className="p-4 flex flex-col gap-2 flex-1 min-h-0">
              {/* Name + logo + rating */}
              <div className="flex items-center gap-3">
                {offer.logo_url && (
                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0" style={{ background: offer.logo_bg || "#1a1a1a", border: "1px solid var(--gold-dark)" }}>
                    <img src={offer.logo_url} alt={offer.name} className="w-full h-full object-contain" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg leading-tight truncate" style={{ color: "var(--ink-dark)", fontFamily: "'Cinzel', serif" }}>{offer.name}</h3>
                  {offer.is_exclusive !== false && (
                    <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "var(--gold-mid)" }}>✦ Oferta Exclusiva</p>
                  )}
                </div>
                <StarRating rating={offer.rating ?? 4.5} />
              </div>

              {/* Bonus highlight */}
              <div className="rounded-lg px-3 py-2" style={{ background: "rgba(139,105,20,0.08)", border: "1px solid var(--parchment-edge)" }}>
                <p className="text-sm" style={{ color: "var(--ink-mid)" }}>{offer.headline}</p>
                <p className="text-base font-bold mt-0.5" style={{ color: "var(--gold-bright)", fontFamily: "'Cinzel', serif" }}>{offer.bonus_value}</p>
                {((offer.free_spins && offer.free_spins !== "—" && offer.free_spins.trim() !== "") || (offer.cashback && offer.cashback.trim() !== "")) && (
                  <p className="text-xs mt-0.5" style={{ color: "var(--ink-light)" }}>
                    {offer.free_spins && offer.free_spins !== "—" && offer.free_spins.trim() !== "" ? `+ ${offer.free_spins} Free Spins` : ""}
                    {offer.cashback && offer.cashback.trim() !== "" ? ` · ${offer.cashback} Cashback` : ""}
                  </p>
                )}
              </div>

              {/* Promo code */}
              {offer.code && offer.code !== "—" && (
                <button
                  className="flex items-center gap-2 rounded-lg px-3 py-2 w-full text-left transition-colors"
                  style={{ border: "1px solid var(--gold-mid)", background: "rgba(212,160,23,0.1)" }}
                  onClick={handleCopyCode}
                >
                  <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "var(--ink-light)" }}>Código</span>
                  <span className="font-mono font-bold text-sm flex-1" style={{ color: "var(--gold-dark)" }}>{offer.code}</span>
                  <span className="text-[10px]" style={{ color: "var(--ink-light)" }}>{copied ? "✓ Copiado" : "Copiar"}</span>
                </button>
              )}

              {/* CTA */}
              <div className="mt-auto">
                {ctaButton}
                <p className="text-[10px] text-center mt-1" style={{ color: "var(--ink-light)" }}>18+ · T&Cs Aplicáveis · Joga com responsabilidade</p>
              </div>

              {/* Flip hint */}
              <p className="flip-hint" onClick={(e) => { e.stopPropagation(); setFlipped(true); }}>Toca para ver detalhes ↻</p>
            </div>
          </div>
        </div>

        {/* ═══ BACK ═══ */}
        <div className="papyrus-flip-face papyrus-flip-back">
          <div className="rounded-2xl overflow-hidden flex flex-col h-full" style={cardStyle}>
            <div className="p-4 flex flex-col gap-2 flex-1 min-h-0">

              {/* Casino name header on back */}
              <h3 className="font-semibold text-base text-center" style={{ color: "var(--ink-dark)", fontFamily: "'Cinzel', serif", borderBottom: "1px solid var(--parchment-edge)", paddingBottom: "8px" }}>{offer.name}</h3>

              {/* Star rating */}
              <div className="flex justify-center">
                <StarRating rating={offer.rating ?? 4.5} />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: "Depósito Mín.", value: offer.min_deposit },
                  { label: "Levantamento", value: offer.withdraw_time },
                  { label: "Licença", value: offer.license },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg px-2 py-1.5" style={{ background: "rgba(139,105,20,0.06)", border: "1px solid var(--parchment-edge)" }}>
                    <p className="text-[9px] uppercase tracking-wider font-semibold leading-none" style={{ color: "var(--ink-light)" }}>{label}</p>
                    <p className="text-xs font-medium mt-1 truncate" style={{ color: "var(--ink-dark)" }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div style={{ height: "1px", background: "var(--parchment-edge)" }} />

              {/* Perks/tags */}
              <div className="flex flex-wrap gap-1.5">
                {perks.map((perk) => (
                  <span key={perk} className="text-[11px] rounded-full px-2.5 py-0.5" style={{ border: "1px solid var(--parchment-edge)", background: "rgba(212,184,122,0.2)", color: "var(--ink-mid)" }}>{perk}</span>
                ))}
              </div>

              {/* Notes */}
              {offer.notes && offer.notes.length > 0 && (
                <div className="space-y-0.5">
                  {offer.notes.map((note, idx) => (
                    <p key={idx} className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: "var(--ink-light)" }}>{note}</p>
                  ))}
                </div>
              )}

              {/* CTA */}
              <div className="mt-auto">{ctaButton}</div>

              {/* Flip hint */}
              <p className="flip-hint" onClick={(e) => { e.stopPropagation(); setFlipped(false); }}>Toca para voltar ↻</p>
            </div>
          </div>
        </div>

      </div>

      {/* Copy toast */}
      {copied && (
        <div className="absolute inset-x-0 bottom-4 flex justify-center pointer-events-none z-50">
          <span className="rounded-full px-4 py-1.5 text-xs font-semibold" style={{ background: "rgba(212,160,23,0.15)", border: "1px solid var(--gold-mid)", color: "var(--gold-dark)" }}>✦ Código copiado ✦</span>
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
