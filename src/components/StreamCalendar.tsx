"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import type { ScheduledStreamRow } from "@/lib/supabase";

/* ── Category styling ──────────────────────────────────────── */
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  "Slots":      { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30", glow: "shadow-amber-500/20" },
  "Bonus Hunt": { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30", glow: "shadow-purple-500/20" },
  "Torneio":    { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30", glow: "shadow-blue-500/20" },
  "Especial":   { bg: "bg-arena-gold/10", text: "text-arena-gold", border: "border-arena-gold/30", glow: "shadow-arena-gold/20" },
  "Giveaway":   { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/30", glow: "shadow-green-500/20" },
  "Outro":      { bg: "bg-gray-500/10", text: "text-gray-400", border: "border-gray-500/30", glow: "shadow-gray-500/20" },
};

const CATEGORY_ICONS: Record<string, string> = {
  "Slots": "🎰",
  "Bonus Hunt": "🎯",
  "Torneio": "⚔️",
  "Especial": "⭐",
  "Giveaway": "🎁",
  "Outro": "📺",
};

/* ── Day abbreviations ─────────────────────────────────────── */
const DAY_NAMES_PT = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const DAY_NAMES_FULL = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

/* ── Helpers ───────────────────────────────────────────────── */
const formatDateFull = (dateStr: string) => {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" });
};

const formatDay = (dateStr: string) => {
  const d = new Date(dateStr + "T00:00:00");
  return d.getDate();
};

const formatMonth = (dateStr: string) => {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("pt-PT", { month: "short" }).toUpperCase();
};

const isToday = (dateStr: string) => dateStr === new Date().toISOString().split("T")[0];
const isPast = (dateStr: string) => dateStr < new Date().toISOString().split("T")[0];

/* ── Get current week dates (Mon–Sun) ──────────────────────── */
function getWeekDates(offset = 0): string[] {
  const now = new Date();
  const dayOfWeek = (now.getDay() + 6) % 7; // Mon=0
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek + offset * 7);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}

/* ═══════════════════════════════════════════════════════════════
   SHIELD DAY HEADER
   ═══════════════════════════════════════════════════════════════ */
function ShieldHeader({ dayName, date, isActive }: { dayName: string; date: string; isActive: boolean }) {
  const dayNum = formatDay(date);
  const month = formatMonth(date);

  return (
    <div className={`gladiator-shield ${isActive ? "gladiator-shield--active" : ""}`}>
      <div className="gladiator-shield__top">
        <span className="gladiator-shield__day">{dayName}</span>
      </div>
      <div className="gladiator-shield__date">
        <span className="gladiator-shield__num">{dayNum}</span>
        <span className="gladiator-shield__month">{month}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export function StreamCalendar() {
  const [streams, setStreams] = useState<ScheduledStreamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);

  const fetchStreams = useCallback(async () => {
    try {
      const r = await fetch("/api/scheduled-streams");
      const d = await r.json();
      if (d.streams) setStreams(d.streams);
    } catch { /* noop */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStreams();

    const channel = supabase
      .channel("scheduled_streams_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "scheduled_streams" }, () => {
        fetchStreams();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchStreams]);

  const weekDates = getWeekDates(weekOffset);
  const streamsForDate = (date: string) => streams.filter((s) => s.stream_date === date && !s.is_cancelled);

  // Collect unique categories this week
  const weekCategories = new Set<string>();
  weekDates.forEach((d) => {
    streamsForDate(d).forEach((s) => (s.categories || ["Outro"]).forEach((c) => weekCategories.add(c)));
  });

  // Special events this week
  const specialStreams = weekDates.flatMap((d) => streamsForDate(d).filter((s) => s.is_special || s.description));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-arena-gold/30 border-t-arena-gold rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="gladiator-schedule">
      {/* ══ HEADER ══ */}
      <div className="gladiator-schedule__header">
        <div className="gladiator-schedule__emblem">
          <img src="/images/BrutoEmblem.png" alt="Arena" className="w-20 h-20 object-contain drop-shadow-lg" />
        </div>
        <h1 className="gladiator-schedule__title">
          <span className="gladiator-schedule__title-top">Streaming</span>
          <span className="gladiator-schedule__title-main">Schedule</span>
        </h1>
        <p className="gladiator-schedule__subtitle">@BRUTUSPOLUS</p>

        {/* Week navigation */}
        <div className="gladiator-schedule__nav">
          <button onClick={() => setWeekOffset((w) => w - 1)} className="gladiator-nav-btn" aria-label="Semana anterior">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className={`gladiator-nav-btn gladiator-nav-btn--today ${weekOffset === 0 ? "gladiator-nav-btn--active" : ""}`}
          >
            Esta Semana
          </button>
          <button onClick={() => setWeekOffset((w) => w + 1)} className="gladiator-nav-btn" aria-label="Próxima semana">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* ══ WEEKLY GRID ══ */}
      <AnimatePresence mode="wait">
        <motion.div
          key={weekOffset}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.3 }}
          className="gladiator-week"
        >
          {weekDates.map((date, i) => {
            const dow = new Date(date + "T00:00:00").getDay();
            const dayStreams = streamsForDate(date);
            const active = isToday(date);
            const past = isPast(date);

            return (
              <div key={date} className={`gladiator-day ${active ? "gladiator-day--today" : ""} ${past ? "gladiator-day--past" : ""}`}>
                <ShieldHeader dayName={DAY_NAMES_PT[dow]} date={date} isActive={active} />

                {/* Spear divider */}
                <div className="gladiator-spear" />

                {/* Stream slots */}
                <div className="gladiator-day__slots">
                  {dayStreams.length > 0 ? (
                    dayStreams.map((stream) => {
                      const cats = stream.categories || ["Outro"];
                      return (
                        <div key={stream.id} className={`gladiator-slot ${stream.is_special ? "gladiator-slot--special" : ""}`}>
                          <div className="gladiator-slot__time">
                            {stream.start_time.slice(0, 5)}
                            {stream.end_time ? ` - ${stream.end_time.slice(0, 5)}` : " - ?"}
                          </div>
                          <div className="gladiator-slot__title">{stream.title}</div>
                          <div className="gladiator-slot__cats">
                            {cats.map((c) => (
                              <span key={c} className="gladiator-slot__cat">
                                {CATEGORY_ICONS[c] || "📺"}
                              </span>
                            ))}
                          </div>
                          {stream.casino && (
                            <div className="gladiator-slot__casino">🎰 {stream.casino}</div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="gladiator-slot gladiator-slot--empty">
                      <div className="gladiator-slot__title" style={{ opacity: 0.4 }}>—</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* ══ BOTTOM SECTIONS ══ */}
      <div className="gladiator-schedule__footer">
        {/* Jogos da Semana */}
        <div className="gladiator-footer-section">
          <h3 className="gladiator-footer-section__title">⚔ Jogos da Semana</h3>
          <div className="gladiator-footer-section__content">
            {weekCategories.size > 0 ? (
              <div className="flex flex-wrap gap-2 justify-center">
                {Array.from(weekCategories).map((cat) => {
                  const c = CATEGORY_COLORS[cat] || CATEGORY_COLORS["Outro"];
                  return (
                    <span key={cat} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${c.bg} ${c.text} ${c.border}`}>
                      {CATEGORY_ICONS[cat]} {cat}
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="text-arena-ash text-sm text-center">Sem jogos agendados</p>
            )}
          </div>
        </div>

        {/* Eventos Especiais / Notas */}
        <div className="gladiator-footer-section">
          <h3 className="gladiator-footer-section__title">🏛 Eventos Especiais / Notas</h3>
          <div className="gladiator-footer-section__content">
            {specialStreams.length > 0 ? (
              <div className="space-y-2">
                {specialStreams.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 text-sm">
                    <span className="text-arena-gold">⭐</span>
                    <span className="text-arena-smoke font-medium">{s.title}</span>
                    {s.description && <span className="text-arena-ash">— {s.description}</span>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-arena-ash text-sm text-center">Sem eventos especiais esta semana</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
