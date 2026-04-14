"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { CasinoOfferRow } from "@/lib/supabase";

/* ═══════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════ */

export interface CasinoOffer {
  slug: string;
  name: string;
  logo_url?: string;
  logo_bg: string;
  banner_url?: string;
  badge?: "NEW" | "HOT";
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
function CornerOrnament({ className }: { className: string }) {
  return (
    <svg className={`scroll-ornament ${className}`} viewBox="0 0 24 24" fill="none">
      <path
        d="M2 2 L2 10 M2 2 L10 2 M2 6 L6 2"
        stroke="#8b6914"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="4" cy="4" r="1.5" fill="#8b6914" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PAPYRUS SCROLL CARD COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

export function OfferCard({ offer }: { offer: CasinoOffer }) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = useCallback(() => {
    navigator.clipboard?.writeText(offer.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [offer.code]);

  // Build perks from tags
  const perks = offer.tags.length > 0 ? offer.tags : ["🎰 Slots", "⚡ Instant Play", "🛡 SSL"];

  return (
    <div className="papyrus-scroll-wrapper">
      {/* ═══ Scroll Body ═══ */}
      <div className="papyrus-scroll greek-key-border papyrus-scroll-top papyrus-scroll-bottom">
        {/* Corner Ornaments */}
        <CornerOrnament className="top-left" />
        <CornerOrnament className="top-right" />
        <CornerOrnament className="bottom-left" />
        <CornerOrnament className="bottom-right" />

        {/* ═══ Content ═══ */}
        <div className="scroll-content">

          {/* ── Header ── */}
          <div className="scroll-header">
            <div className="scroll-emblem">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2C8 2 5 5 5 9v2c0 1-.5 2-1 3l-1 2c-.5 1 0 2 1 2h14c1 0 1.5-1 1-2l-1-2c-.5-1-1-2-1-3V9c0-4-3-7-7-7z"
                  fill="rgba(60,40,10,0.7)"
                  stroke="rgba(255,220,100,0.4)"
                  strokeWidth="0.5"
                />
                <path d="M9 9h6v3H9z" fill="rgba(255,220,100,0.3)" />
                <path d="M10 12v3h4v-3" fill="rgba(60,40,10,0.5)" />
              </svg>
            </div>
            <h2 className="scroll-title">{offer.name}</h2>
            <p className="scroll-subtitle">Est. {offer.established} · {offer.license}</p>
          </div>

          {/* ── Engraved Divider ── */}
          <div className="engraved-divider" />

          {/* ── Casino Banner ── */}
          <div className="casino-banner">
            <div className="casino-banner-inner">
              {offer.banner_url ? (
                <img
                  src={offer.banner_url}
                  alt={offer.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
                />
              ) : null}
              <span className="casino-banner-text">{offer.name}</span>
            </div>
          </div>

          {/* ── Rating ── */}
          <StarRating rating={4.8} />

          {/* ── Stat Rows ── */}
          <div className="stat-rows">
            <div className="stat-row">
              <span className="stat-label">Licença</span>
              <span className="stat-value">{offer.license}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Levantamento</span>
              <span className="stat-value">{offer.withdraw_time}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Depósito Mín.</span>
              <span className="stat-value">{offer.min_deposit}</span>
            </div>
          </div>

          {/* ── Perks ── */}
          <div className="perks-list">
            {perks.map((perk) => (
              <span key={perk} className="perk-tag">{perk}</span>
            ))}
          </div>

          {/* ── Engraved Divider ── */}
          <div className="engraved-divider" />

          {/* ── Promo Section ── */}
          <div className="promo-section">
            <p className="promo-label">✦ Oferta Exclusiva ✦</p>
            <p className="promo-bonus">
              {offer.headline}
              <span className="promo-bonus-accent">{offer.bonus_value}</span>
            </p>
            <p className="promo-detail">
              {offer.free_spins !== "—" ? `+ ${offer.free_spins} Free Spins` : ""}
              {offer.cashback ? ` · ${offer.cashback} Cashback` : ""}
            </p>

            {/* Promo Code */}
            {offer.code && offer.code !== "—" && (
              <div className="promo-code-wrapper" onClick={handleCopyCode} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && handleCopyCode()}>
                <span className="promo-code-label">Código</span>
                <span className="promo-code-value">{offer.code}</span>
                <span className="promo-code-copy">{copied ? "✓ Copiado" : "📋 Copiar"}</span>
              </div>
            )}
          </div>

          {/* ── Wax Seal ── */}
          <div style={{ margin: "16px 0" }}>
            <div className="wax-seal" />
          </div>

          {/* ── CTA Button ── */}
          <div className="cta-section">
            <a href={offer.affiliate_url} target="_blank" rel="noopener noreferrer">
              <button className="cta-button">
                ⚔ Resgatar Bónus ⚔
              </button>
            </a>
            <p className="cta-subtext">18+ · T&Cs Aplicáveis · Joga com responsabilidade</p>
          </div>
        </div>
      </div>

      {/* ── Copy Toast ── */}
      <div className={`copy-toast ${copied ? "visible" : ""}`}>
        ✦ Código promocional copiado ✦
      </div>
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
          }))
        );
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="mt-12 text-center text-arena-ash py-12">A carregar ofertas...</div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className={`mt-12 text-center text-arena-ash py-12 ${emptyClassName}`}>
        <p className="text-lg">Nenhuma oferta disponível de momento.</p>
        <p className="text-sm mt-2">Volta em breve para novas promoções!</p>
      </div>
    );
  }

  return (
    <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
      {offers.map((offer) => (
        <OfferCard key={offer.slug} offer={offer} />
      ))}
    </div>
  );
}
