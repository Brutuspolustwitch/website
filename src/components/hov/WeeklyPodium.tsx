"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { Victory } from "./types";

const RANK_THEMES = [
  { // 1st — gold
    label: "Imperator",
    border: "rgba(240,215,140,0.85)",
    glow: "0 0 60px rgba(240,180,40,0.55), 0 0 22px rgba(255,140,40,0.35)",
    text: "#f0d78c",
    accent: "#ffb347",
    bg: "linear-gradient(180deg, rgba(60,40,10,0.95), rgba(20,12,4,0.95))",
    scale: "lg:scale-110",
    z: "z-20",
  },
  { // 2nd — silver
    label: "Centurion",
    border: "rgba(200,205,215,0.7)",
    glow: "0 0 32px rgba(180,190,210,0.35)",
    text: "#dde2ec",
    accent: "#c0c8d4",
    bg: "linear-gradient(180deg, rgba(40,42,50,0.95), rgba(15,16,20,0.95))",
    scale: "",
    z: "z-10",
  },
  { // 3rd — bronze
    label: "Legionary",
    border: "rgba(205,127,50,0.75)",
    glow: "0 0 32px rgba(205,127,50,0.4)",
    text: "#e8a76a",
    accent: "#cd7f32",
    bg: "linear-gradient(180deg, rgba(55,30,10,0.95), rgba(20,10,4,0.95))",
    scale: "",
    z: "z-10",
  },
] as const;

function fmt(n: number) {
  return n.toLocaleString("pt-PT", { maximumFractionDigits: 2 });
}

function PodiumCard({ v, rank }: { v: Victory; rank: 0 | 1 | 2 }) {
  const t = RANK_THEMES[rank];
  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: rank * 0.12 }}
      whileHover={{ y: -6 }}
      className={`relative flex-1 max-w-[340px] ${t.scale} ${t.z} group`}
    >
      {/* Torch flickers */}
      <div className="pointer-events-none absolute -top-6 -left-3 w-6 h-12 opacity-70">
        <motion.div
          className="w-full h-full rounded-full blur-md"
          style={{ background: "radial-gradient(circle, #ffb347 0%, transparent 70%)" }}
          animate={{ opacity: [0.55, 0.95, 0.6, 0.85, 0.55], scale: [1, 1.15, 0.95, 1.1, 1] }}
          transition={{ duration: 2.4, repeat: Infinity }}
        />
      </div>
      <div className="pointer-events-none absolute -top-6 -right-3 w-6 h-12 opacity-70">
        <motion.div
          className="w-full h-full rounded-full blur-md"
          style={{ background: "radial-gradient(circle, #ffb347 0%, transparent 70%)" }}
          animate={{ opacity: [0.85, 0.55, 0.95, 0.6, 0.85], scale: [1.1, 0.95, 1.15, 1, 1.1] }}
          transition={{ duration: 2.4, repeat: Infinity }}
        />
      </div>

      <div
        className="relative overflow-hidden rounded-2xl"
        style={{
          background: t.bg,
          border: `2px solid ${t.border}`,
          boxShadow: t.glow,
        }}
      >
        {/* Arch / pediment */}
        <div
          className="px-4 pt-3 pb-2 text-center border-b"
          style={{ borderColor: t.border, background: "rgba(0,0,0,0.45)" }}
        >
          <div
            className="text-[10px] font-bold uppercase tracking-[0.4em] font-[family-name:var(--font-display)]"
            style={{ color: t.accent }}
          >
            {t.label} · #{rank + 1}
          </div>
        </div>

        {/* Slot image */}
        <div className="relative aspect-[5/4] bg-black/60">
          <Image
            src={v.image_url}
            alt={v.slot_name}
            fill
            sizes="(max-width:768px) 100vw, 340px"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            unoptimized
          />
          {/* Vignette */}
          <div className="absolute inset-0" style={{
            background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.75) 100%)"
          }} />
          {/* Multiplier */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ filter: ["brightness(1)", "brightness(1.25)", "brightness(1)"] }}
            transition={{ duration: 2.8, repeat: Infinity }}
          >
            <div
              className="font-[family-name:var(--font-display)] font-black tracking-tight"
              style={{
                fontSize: rank === 0 ? "4.5rem" : "3.2rem",
                color: t.text,
                textShadow: `0 0 24px ${t.accent}, 0 4px 0 rgba(0,0,0,0.7)`,
                lineHeight: 1,
              }}
            >
              ×{fmt(v.multiplier)}
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 text-center" style={{ background: "rgba(0,0,0,0.55)" }}>
          <div className="text-sm font-semibold text-arena-white truncate">{v.slot_name}</div>
          <div className="text-xs uppercase tracking-widest mt-1" style={{ color: t.accent }}>
            {v.username}
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export default function WeeklyPodium({ winners }: { winners: Victory[] }) {
  if (!winners || winners.length === 0) {
    return (
      <div className="text-center py-10 text-arena-smoke italic">
        A arena aguarda os primeiros campeões desta semana…
      </div>
    );
  }

  // Display order: 2nd, 1st, 3rd
  const ordered: Array<{ v: Victory; rank: 0 | 1 | 2 }> = [];
  if (winners[1]) ordered.push({ v: winners[1], rank: 1 });
  if (winners[0]) ordered.push({ v: winners[0], rank: 0 });
  if (winners[2]) ordered.push({ v: winners[2], rank: 2 });

  return (
    <div className="flex items-end justify-center gap-3 sm:gap-5 px-2">
      {ordered.map(({ v, rank }) => <PodiumCard key={v.id} v={v} rank={rank} />)}
    </div>
  );
}
