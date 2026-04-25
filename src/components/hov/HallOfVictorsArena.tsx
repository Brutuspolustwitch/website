"use client";

import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import WeeklyPodium from "./WeeklyPodium";
import VictoryCard from "./VictoryCard";
import SubmissionModal from "./SubmissionModal";
import type { Victory, WinnersResponse } from "./types";
import { PROVIDERS } from "./types";

type SortMode = "created_at" | "multiplier";

export default function HallOfVictorsArena() {
  const { user } = useAuth();
  const [winners, setWinners] = useState<Victory[]>([]);
  const [winnersLabel, setWinnersLabel] = useState<string>("");
  const [victories, setVictories] = useState<Victory[]>([]);
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<string>("All");
  const [minMult, setMinMult] = useState<string>("");
  const [sort, setSort] = useState<SortMode>("created_at");
  const [modalOpen, setModalOpen] = useState(false);

  const loadWinners = useCallback(async () => {
    const res = await fetch("/api/hall-of-victors/winners", { cache: "no-store" });
    if (!res.ok) return;
    const j: WinnersResponse = await res.json();
    if (j.frozen && j.frozen.victories.length > 0) {
      setWinners(j.frozen.victories);
      setWinnersLabel(`Semana de ${j.frozen.week_id}`);
    } else {
      setWinners(j.live_top3);
      setWinnersLabel(`Esta semana — em curso`);
    }
  }, []);

  const loadVictories = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("sort", sort);
    if (provider !== "All") params.set("provider", provider);
    const min = parseFloat(minMult);
    if (isFinite(min) && min > 0) params.set("min_multiplier", String(min));
    try {
      const res = await fetch(`/api/hall-of-victors?${params}`, { cache: "no-store" });
      const j = await res.json();
      if (res.ok) setVictories(j.victories ?? []);
    } finally { setLoading(false); }
  }, [provider, minMult, sort]);

  useEffect(() => { void loadWinners(); }, [loadWinners]);
  useEffect(() => { void loadVictories(); }, [loadVictories]);

  return (
    <div className="relative min-h-screen pt-20 pb-24 overflow-hidden"
      style={{
        background: "radial-gradient(ellipse at top, #2a1a0a 0%, #0a0604 65%, #000 100%)",
      }}
    >
      {/* Embers */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        {Array.from({ length: 18 }).map((_, i) => (
          <motion.span
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              left: `${(i * 53) % 100}%`,
              bottom: 0,
              background: "radial-gradient(circle, #ffb347 0%, transparent 70%)",
              boxShadow: "0 0 6px #ffb347",
            }}
            animate={{ y: [-0, -700], opacity: [0.8, 0], x: [0, (i % 2 ? 30 : -30)] }}
            transition={{ duration: 6 + (i % 5), repeat: Infinity, delay: i * 0.4 }}
          />
        ))}
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section A: Podium */}
        <section className="mb-16">
          <SectionTitle>Brutas da Semana</SectionTitle>
          <div className="text-center text-arena-smoke text-sm mb-6">{winnersLabel}</div>
          <WeeklyPodium winners={winners} />
        </section>

        {/* Section B: Latest grid */}
        <section className="mb-12">
          <SectionTitle>Latest Victories</SectionTitle>

          {/* Filters */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            <Select label="Provedor" value={provider} onChange={setProvider}
              options={["All", ...PROVIDERS]} />
            <NumInput label="Mult. Mínimo" value={minMult} onChange={setMinMult} />
            <Select label="Ordenar" value={sort} onChange={(v) => setSort(v as SortMode)}
              options={[
                { value: "created_at", label: "Mais Recentes" },
                { value: "multiplier", label: "Maior Multiplicador" },
              ] as unknown as string[]} />
          </div>

          {loading ? (
            <div className="text-center text-arena-smoke">A carregar…</div>
          ) : victories.length === 0 ? (
            <div className="text-center text-arena-smoke italic">Sem vitórias para os filtros escolhidos.</div>
          ) : (
            <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {victories.map(v => <VictoryCard key={v.id} v={v} />)}
              </AnimatePresence>
            </motion.div>
          )}
        </section>

        {/* Section C: Submit CTA */}
        <section className="text-center">
          {user ? (
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}
              onClick={() => setModalOpen(true)}
              className="px-10 py-4 rounded-lg font-[family-name:var(--font-display)] font-black uppercase tracking-[0.3em] text-lg"
              style={{
                background: "linear-gradient(180deg,#c0392b,#7d1f15)",
                color: "#fff1d6",
                border: "2px solid rgba(240,215,140,0.7)",
                boxShadow: "0 0 30px rgba(199,57,43,0.55), inset 0 0 0 1px rgba(0,0,0,0.4)",
              }}
            >
              Submit Your Victory
            </motion.button>
          ) : (
            <div className="text-arena-smoke">
              Inicia sessão com Twitch para submeteres a tua vitória.
            </div>
          )}
        </section>
      </div>

      <SubmissionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmitted={() => { void loadVictories(); }}
      />
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-center font-[family-name:var(--font-display)] text-2xl sm:text-3xl uppercase tracking-[0.25em] mb-4"
      style={{ color: "#f0d78c", textShadow: "0 0 16px rgba(255,180,71,0.35)" }}
    >
      ◆ {children} ◆
    </h2>
  );
}

function Select({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: ReadonlyArray<string | { value: string; label: string }>;
}) {
  return (
    <label className="text-xs uppercase tracking-widest text-arena-smoke flex items-center gap-2">
      {label}:
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="px-3 py-1.5 rounded bg-black/60 border border-arena-gold/40 text-arena-white text-sm focus:outline-none focus:border-arena-gold-light">
        {options.map(o => {
          const opt = typeof o === "string" ? { value: o, label: o } : o;
          return <option key={opt.value} value={opt.value}>{opt.label}</option>;
        })}
      </select>
    </label>
  );
}

function NumInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="text-xs uppercase tracking-widest text-arena-smoke flex items-center gap-2">
      {label}:
      <input value={value} onChange={(e) => onChange(e.target.value)} inputMode="decimal" placeholder="0"
        className="w-20 px-2 py-1.5 rounded bg-black/60 border border-arena-gold/40 text-arena-white text-sm focus:outline-none focus:border-arena-gold-light" />
    </label>
  );
}
