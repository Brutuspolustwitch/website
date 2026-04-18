"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ── Types ─────────────────────────────────────────────── */
interface LeaderboardYear {
  id: string;
  year: number;
  is_active: boolean;
  is_locked: boolean;
}

interface LeaderboardEntry {
  id: string;
  year_id: string;
  month: number;
  winner_name: string;
  winner_avatar: string | null;
}

const MONTH_NAMES = [
  "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL",
  "MAIO", "JUNHO", "JULHO", "AGOSTO",
  "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO",
];

/* ── Main Component ────────────────────────────────────── */
export default function LigaDosBrutusContent() {
  const [years, setYears] = useState<LeaderboardYear[]>([]);
  const [selectedYear, setSelectedYear] = useState<LeaderboardYear | null>(null);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const currentMonth = new Date().getMonth() + 1;

  const fetchYears = useCallback(async () => {
    const res = await fetch("/api/leaderboard?list=true");
    const data = await res.json();
    if (data.years) setYears(data.years);
  }, []);

  const fetchEntries = useCallback(async (year: number) => {
    const res = await fetch(`/api/leaderboard?year=${year}`);
    const data = await res.json();
    if (data.year) setSelectedYear(data.year);
    if (data.entries) setEntries(data.entries);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch("/api/leaderboard?list=true");
      const data = await res.json();
      const yearsList: LeaderboardYear[] = data.years ?? [];
      setYears(yearsList);

      const active = yearsList.find((y) => y.is_active) ?? yearsList[0];
      if (active) {
        await fetchEntries(active.year);
      }
      setLoading(false);
    })();
  }, [fetchEntries]);

  const handleYearChange = async (year: number) => {
    setLoading(true);
    await fetchEntries(year);
    setLoading(false);
  };

  // Find top player of the year (most months won)
  const topPlayer = (() => {
    const counts: Record<string, number> = {};
    entries.forEach((e) => {
      if (e.winner_name) {
        counts[e.winner_name] = (counts[e.winner_name] ?? 0) + 1;
      }
    });
    let best = "";
    let max = 0;
    for (const [name, count] of Object.entries(counts)) {
      if (count > max) { max = count; best = name; }
    }
    return best && max > 1 ? best : null;
  })();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-arena-gold/30 border-t-arena-gold rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="relative z-10 pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ── Title ───────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="liga-title">
              Vencedores {selectedYear?.year ?? ""}
            </h1>

            {/* Year selector */}
            {years.length > 1 && (
              <div className="flex gap-2 flex-wrap justify-center mt-4">
                {years.map((y) => (
                  <button
                    key={y.id}
                    onClick={() => handleYearChange(y.year)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-[family-name:var(--font-display)] tracking-wider border transition-all duration-300 ${
                      selectedYear?.year === y.year
                        ? "bg-arena-gold/20 border-arena-gold/50 text-arena-gold shadow-[0_0_12px_rgba(212,168,67,0.2)]"
                        : "bg-white/[0.03] border-white/10 text-arena-smoke hover:border-arena-gold/30 hover:text-arena-gold"
                    }`}
                  >
                    {y.year}
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* ── Top Player Badge ─────────────────── */}
          {topPlayer && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="liga-top-badge"
            >
              <span className="text-base">👑</span>
              <span className="liga-top-badge-text">
                Gladiador do Ano: <strong>{topPlayer}</strong>
              </span>
            </motion.div>
          )}

          {/* ── Month Entries ────────────────────── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedYear?.year ?? "empty"}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="liga-entries-list"
            >
              {entries.length > 0 ? entries.map((entry) => {
                const isCurrentMonth = selectedYear?.is_active && entry.month === currentMonth;
                return (
                  <motion.div
                    key={entry.id}
                    className={`liga-row ${isCurrentMonth ? "liga-row-current" : ""}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: entry.month * 0.04 }}
                  >
                    <span className="liga-row-month">{MONTH_NAMES[entry.month - 1]}</span>
                    <span className="liga-row-line" />
                    <span className={`liga-row-winner ${entry.winner_name ? "" : "liga-row-winner--empty"}`}>
                      {entry.winner_avatar && (
                        <img
                          src={entry.winner_avatar}
                          alt=""
                          className="liga-row-avatar"
                        />
                      )}
                      {entry.winner_name || "—"}
                    </span>
                  </motion.div>
                );
              }) : (
                <div className="text-center py-10 text-arena-smoke/50 font-[family-name:var(--font-display)] text-sm italic">
                  Nenhum dado disponível
                </div>
              )}
            </motion.div>
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}
