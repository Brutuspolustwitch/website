"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
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

/* ═══════════════════════════════════════════════════════════════════
   FLIP CARD COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

export function OfferCard({ offer }: { offer: CasinoOffer }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className="relative w-full aspect-[3/4] cursor-pointer [perspective:1000px]"
      onClick={() => setFlipped(!flipped)}
    >
      <motion.div
        className="relative w-full h-full [transform-style:preserve-3d] transition-transform duration-500"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        {/* ── FRONT ─────────────────────────────────────── */}
        <div className="absolute inset-0 [backface-visibility:hidden] rounded-2xl overflow-hidden border border-white/10 bg-arena-dark flex flex-col">
          {/* Banner */}
          <div className="relative h-[45%] overflow-hidden">
            {offer.banner_url ? (
              <Image src={offer.banner_url} alt={offer.name} fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-900/60 via-fuchsia-800/40 to-arena-dark" />
            )}
            {/* Badge */}
            {offer.badge && (
              <span className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide text-white ${
                offer.badge === "NEW" ? "bg-green-500" : "bg-orange-500"
              }`}>
                ● {offer.badge}
              </span>
            )}
            {/* Tags */}
            <div className="absolute bottom-3 left-3 flex gap-1.5">
              {offer.tags.map((tag) => (
                <span key={tag} className="bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>
            {/* Casino name watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="gladiator-label text-2xl lg:text-3xl font-black text-white/30">
                {offer.name}
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 p-4 flex flex-col">
            <div className="flex items-start justify-between gap-2 mb-3">
              <h3 className="text-sm font-bold text-white leading-tight flex-1">{offer.headline}</h3>
              <button className="shrink-0 text-[9px] font-bold uppercase border border-arena-gold/40 text-arena-gold px-2 py-1 rounded hover:bg-arena-gold/10 transition-colors">
                More Info
              </button>
            </div>
            <p className="text-[9px] text-arena-ash mb-3">+18 | T&C APPLY</p>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
              <div className="flex items-center gap-1.5">
                <span className="text-arena-gold text-xs">💰</span>
                <div>
                  <p className="text-[9px] text-arena-ash">Min. deposit</p>
                  <p className="text-xs font-bold text-white">{offer.min_deposit}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-arena-gold text-xs">🔑</span>
                <div>
                  <p className="text-[9px] text-arena-ash">Code</p>
                  <p className="text-xs font-bold text-white">{offer.code}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-arena-gold text-xs">🎁</span>
                <div>
                  <p className="text-[9px] text-arena-ash">Bonus value</p>
                  <p className="text-xs font-bold text-white">{offer.bonus_value}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-arena-gold text-xs">{offer.cashback ? "💸" : "🎰"}</span>
                <div>
                  <p className="text-[9px] text-arena-ash">{offer.cashback ? "Cashback" : "Free spins"}</p>
                  <p className="text-xs font-bold text-white">{offer.cashback || offer.free_spins}</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <a
              href={offer.affiliate_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="mt-auto block w-full text-center py-2.5 rounded-xl bg-gradient-to-r from-neutral-700 to-neutral-600 hover:from-neutral-600 hover:to-neutral-500 text-white text-xs font-bold uppercase tracking-wider transition-all"
            >
              Claim Bonus
            </a>
          </div>
        </div>

        {/* ── BACK ──────────────────────────────────────── */}
        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-2xl overflow-hidden border border-white/10 bg-arena-dark flex flex-col p-5">
          {/* Close hint */}
          <button
            onClick={(e) => { e.stopPropagation(); setFlipped(false); }}
            className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-arena-ash text-xs transition-colors"
          >
            ✕
          </button>

          {/* Casino header */}
          <div className="flex items-center gap-3 mb-5">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
              style={{ backgroundColor: offer.logo_bg }}
            >
              {offer.logo_url ? (
                <Image src={offer.logo_url} alt={offer.name} width={48} height={48} className="rounded-xl" />
              ) : (
                offer.name.charAt(0)
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{offer.name}</h3>
              <p className="text-xs text-arena-ash">Est. {offer.established}</p>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3 mb-5">
            <div>
              <p className="text-[11px] text-arena-ash">Withdraw Time</p>
              <p className="text-sm font-bold text-white">{offer.withdraw_time}</p>
            </div>
            <div>
              <p className="text-[11px] text-arena-ash">License</p>
              <p className="text-sm font-bold text-white">{offer.license}</p>
            </div>
          </div>

          {/* Notes */}
          <div className="flex-1 space-y-2.5 text-[12px] text-arena-smoke leading-relaxed">
            {offer.notes.map((note, i) => (
              <p key={i}>
                • {note.includes("(") ? (
                  <>
                    {note.split("(")[0]}
                    <strong className="font-bold">({note.split("(")[1]}</strong>
                  </>
                ) : note}
              </p>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function OfferCards() {
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
      <div className="mt-12 text-center text-arena-ash py-12">
        <p className="text-lg">Nenhuma oferta disponível de momento.</p>
        <p className="text-sm mt-2">Volta em breve para novas promoções!</p>
      </div>
    );
  }

  return (
    <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {offers.map((offer) => (
        <OfferCard key={offer.slug} offer={offer} />
      ))}
    </div>
  );
}
