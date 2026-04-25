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
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

        {/* Multiplier badge */}
        <motion.div
          whileHover={{ scale: 1.06 }}
          className="absolute top-2 right-2 px-3 py-1 rounded-md font-[family-name:var(--font-display)] font-black"
          style={{
            background: "linear-gradient(180deg, rgba(60,40,10,0.95), rgba(20,12,4,0.95))",
            border: "1px solid rgba(240,215,140,0.7)",
            color: "#f0d78c",
            textShadow: "0 0 12px rgba(255,180,71,0.7)",
            boxShadow: "0 0 14px rgba(255,180,71,0.35)",
          }}
        >
          ×{fmt(v.multiplier)}
        </motion.div>

        {v.suspicious && (
          <div
            className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest"
            style={{
              background: "rgba(180,30,30,0.95)",
              color: "#fff",
              border: "1px solid rgba(255,80,80,0.7)",
              boxShadow: "0 0 10px rgba(255,40,40,0.5)",
            }}
          >
            ⚠ Suspeito
          </div>
        )}
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
          <span className="text-arena-smoke truncate ml-2 max-w-[40%]">@{v.username}</span>
        </div>
      </div>
    </motion.article>
  );
}
