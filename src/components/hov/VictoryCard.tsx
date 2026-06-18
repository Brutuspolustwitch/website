"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { Victory } from "./types";

function fmt(n: number) {
  return n.toLocaleString("pt-PT", { maximumFractionDigits: 2 });
}

export default function VictoryCard({ v }: { v: Victory }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ duration: 0.35 }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-xl"
      style={{
        background: "linear-gradient(180deg, rgba(30,22,12,0.92), rgba(14,10,6,0.95))",
        border: "1px solid rgba(205,127,50,0.35)",
        boxShadow: "0 4px 18px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(0,0,0,0.4)",
      }}
    >
      {/* Image */}
      <div className="relative aspect-[16/10] bg-black/50">
        {v.url ? (
          <a
            href={v.url}
            target="_blank"
            rel="noreferrer noopener"
            className="absolute inset-0 z-10"
            aria-label={`Ver vitória: ${v.slot_name}`}
          />
        ) : null}
        {v.image_url ? (
          <Image
            src={v.image_url}
            alt={v.slot_name}
            fill
            sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl opacity-30">🏛️</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        {v.url && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-black/60 border border-white/30 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white ml-0.5">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}

        {/* Multiplier — bottom centered */}
        <motion.div
          className="absolute inset-x-0 bottom-1.5 flex justify-center pointer-events-none"
          animate={{ filter: ["brightness(1)", "brightness(1.2)", "brightness(1)"] }}
          transition={{ duration: 2.8, repeat: Infinity }}
        >
          <div
            className="font-[family-name:var(--font-display)] font-black tracking-tight"
            style={{
              fontSize: "2.4rem",
              lineHeight: 1,
              color: "#f0d78c",
              textShadow: "0 0 18px rgba(255,180,71,0.7), 0 3px 0 rgba(0,0,0,0.85)",
            }}
          >
            ×{fmt(v.multiplier)}
          </div>
        </motion.div>

      </div>

      {/* Body */}
      <div className="px-3 py-2.5">
        <div className="text-sm font-semibold text-arena-white truncate">{v.slot_name}</div>
        <div className="text-[11px] uppercase tracking-widest text-arena-smoke">{v.provider}</div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-arena-smoke">
            <span className="text-emerald-400/90">{fmt(v.bet_amount)}€</span>
            <span className="mx-1.5 opacity-60">→</span>
            <span className="text-amber-300">{fmt(v.win_amount)}€</span>
          </span>
          <div className="flex flex-col items-end gap-0.5 ml-2 max-w-[55%] min-w-0">
            <span className="text-[10px] text-arena-smoke/50 shrink-0">
              {new Date(v.created_at).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
            <span className="flex items-center gap-1.5 text-arena-smoke truncate">
              {v.avatar_url ? (
                <Image
                  src={v.avatar_url}
                  alt={v.username}
                  width={22}
                  height={22}
                  className="rounded-full border border-arena-gold/40 shrink-0"
                  unoptimized
                />
              ) : (
                <span className="w-[22px] h-[22px] rounded-full border border-arena-gold/40 bg-black/50 flex items-center justify-center text-[10px] font-bold text-arena-gold-light shrink-0">
                  {v.username.slice(0,1).toUpperCase()}
                </span>
              )}
              <span className="truncate text-[13px]">@{v.username}</span>
            </span>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
