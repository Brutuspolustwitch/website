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

/* ── Helpers ───────────────────────────────────────────────── */
const formatDateFull = (dateStr: string) => {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" });
};

const formatDateShort = (dateStr: string) => {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("pt-PT", { weekday: "short", day: "numeric", month: "short" });
};

const isToday = (dateStr: string) => dateStr === new Date().toISOString().split("T")[0];
const isTomorrow = (dateStr: string) => {
  const tm = new Date();
  tm.setDate(tm.getDate() + 1);
  return dateStr === tm.toISOString().split("T")[0];
};
const isPast = (dateStr: string) => dateStr < new Date().toISOString().split("T")[0];

const getRelativeLabel = (dateStr: string) => {
  if (isToday(dateStr)) return "Hoje";
  if (isTomorrow(dateStr)) return "Amanhã";
  return null;
};

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export function StreamCalendar() {
  const [streams, setStreams] = useState<ScheduledStreamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"upcoming" | "calendar">("upcoming");
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

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

    // Realtime updates
    const channel = supabase
      .channel("scheduled_streams_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "scheduled_streams" }, () => {
        fetchStreams();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchStreams]);

  const today = new Date().toISOString().split("T")[0];

  /* ── Upcoming streams grouped by date ────────────────────── */
  const upcomingStreams = streams.filter((s) => s.stream_date >= today && !s.is_cancelled);
  const groupedByDate = upcomingStreams.reduce<Record<string, ScheduledStreamRow[]>>((acc, s) => {
    if (!acc[s.stream_date]) acc[s.stream_date] = [];
    acc[s.stream_date].push(s);
    return acc;
  }, {});
  const sortedDates = Object.keys(groupedByDate).sort();

  /* ── Calendar helpers ────────────────────────────────────── */
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfWeek = (year: number, month: number) => (new Date(year, month, 1).getDay() + 6) % 7;
  const streamsForDate = (date: string) => streams.filter((s) => s.stream_date === date && !s.is_cancelled);
  const monthLabel = new Date(calendarMonth.year, calendarMonth.month).toLocaleDateString("pt-PT", { month: "long", year: "numeric" });

  /* ── Next stream highlight ───────────────────────────────── */
  const nextStream = upcomingStreams[0] || null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-arena-gold/30 border-t-arena-gold rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Next Stream Hero ────────────────────────────────── */}
      {nextStream && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-arena-gold/20 bg-gradient-to-br from-arena-gold/5 via-white/[0.02] to-transparent p-6 sm:p-8"
        >
          {/* Background glow */}
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-arena-gold/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-widest text-arena-gold/80">
                  Próxima Stream
                </span>
                {getRelativeLabel(nextStream.stream_date) && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-arena-gold/20 text-arena-gold animate-pulse">
                    {getRelativeLabel(nextStream.stream_date)}
                  </span>
                )}
              </div>

              <h2 className="font-display text-2xl sm:text-3xl text-arena-white uppercase tracking-wide">
                {nextStream.title}
              </h2>

              <div className="flex flex-wrap items-center gap-3 mt-3 text-sm">
                <span className="flex items-center gap-1.5 text-arena-smoke">
                  <span className="text-arena-gold">📅</span> {formatDateFull(nextStream.stream_date)}
                </span>
                <span className="flex items-center gap-1.5 text-arena-smoke">
                  <span className="text-arena-gold">🕐</span> {nextStream.start_time.slice(0, 5)}
                  {nextStream.end_time ? ` – ${nextStream.end_time.slice(0, 5)}` : ""}
                </span>
                {nextStream.casino && (
                  <span className="flex items-center gap-1.5 text-arena-smoke">
                    <span className="text-arena-gold">🎰</span> {nextStream.casino}
                  </span>
                )}
              </div>

              {nextStream.description && (
                <p className="text-sm text-arena-smoke/70 mt-3 max-w-xl">{nextStream.description}</p>
              )}
            </div>

            <div className="shrink-0 text-center">
              {(() => {
                const cat = CATEGORY_COLORS[nextStream.category] || CATEGORY_COLORS["Outro"];
                return (
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${cat.bg} ${cat.text} ${cat.border}`}>
                    <span className="text-lg">{CATEGORY_ICONS[nextStream.category]}</span>
                    <span className="font-bold text-sm">{nextStream.category}</span>
                  </div>
                );
              })()}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── View Toggle ─────────────────────────────────────── */}
      <div className="flex gap-2">
        <button
          onClick={() => setViewMode("upcoming")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            viewMode === "upcoming"
              ? "bg-arena-gold/20 text-arena-gold border border-arena-gold/30"
              : "bg-white/[0.04] text-arena-smoke border border-white/10 hover:bg-white/[0.08]"
          }`}
        >📋 Próximas</button>
        <button
          onClick={() => setViewMode("calendar")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            viewMode === "calendar"
              ? "bg-arena-gold/20 text-arena-gold border border-arena-gold/30"
              : "bg-white/[0.04] text-arena-smoke border border-white/10 hover:bg-white/[0.08]"
          }`}
        >📅 Calendário</button>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === "upcoming" ? (
          /* ── Upcoming List View ──────────────────────────── */
          <motion.div
            key="upcoming"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {sortedDates.length === 0 ? (
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-12 text-center">
                <div className="text-5xl mb-4">📅</div>
                <p className="text-arena-smoke text-lg">Nenhuma stream agendada de momento</p>
                <p className="text-sm text-arena-ash mt-2">Volta mais tarde para ver as próximas lives!</p>
              </div>
            ) : (
              sortedDates.map((date) => (
                <div key={date}>
                  {/* Date header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${
                      isToday(date) ? "bg-arena-gold/10 border border-arena-gold/30" : "bg-white/[0.03] border border-white/10"
                    }`}>
                      {isToday(date) && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
                      <span className={`text-sm font-bold uppercase tracking-wider ${isToday(date) ? "text-arena-gold" : "text-arena-smoke"}`}>
                        {getRelativeLabel(date) || formatDateShort(date)}
                      </span>
                      {getRelativeLabel(date) && (
                        <span className="text-xs text-arena-ash">— {formatDateShort(date)}</span>
                      )}
                    </div>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>

                  {/* Streams for this date */}
                  <div className="space-y-3 ml-2">
                    {groupedByDate[date].map((stream, i) => {
                      const cat = CATEGORY_COLORS[stream.category] || CATEGORY_COLORS["Outro"];
                      return (
                        <motion.div
                          key={stream.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className={`group relative bg-white/[0.03] border border-white/10 rounded-xl p-5 transition-all
                                     hover:bg-white/[0.05] hover:border-white/20 ${
                                       stream.is_special ? `hover:shadow-lg ${cat.glow}` : ""
                                     }`}
                        >
                          {/* Left accent bar */}
                          <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-full ${cat.text.replace("text-", "bg-")}`} />

                          <div className="pl-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${cat.bg} ${cat.text} ${cat.border}`}>
                                    {CATEGORY_ICONS[stream.category]} {stream.category}
                                  </span>
                                  {stream.is_special && (
                                    <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-arena-gold/10 text-arena-gold border border-arena-gold/30">
                                      ⭐ Especial
                                    </span>
                                  )}
                                </div>

                                <h3 className="font-bold text-lg text-arena-white group-hover:text-arena-gold transition-colors">
                                  {stream.title}
                                </h3>

                                {stream.description && (
                                  <p className="text-sm text-arena-smoke/70 mt-1">{stream.description}</p>
                                )}
                              </div>

                              <div className="shrink-0 text-right">
                                <div className="text-xl font-bold text-arena-white font-ui">
                                  {stream.start_time.slice(0, 5)}
                                </div>
                                {stream.end_time && (
                                  <div className="text-xs text-arena-ash mt-0.5">
                                    até {stream.end_time.slice(0, 5)}
                                  </div>
                                )}
                                {stream.casino && (
                                  <div className="text-xs text-arena-ash mt-1">🎰 {stream.casino}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </motion.div>
        ) : (
          /* ── Calendar Grid View ─────────────────────────── */
          <motion.div
            key="calendar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-6"
          >
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setCalendarMonth((p) => p.month === 0 ? { year: p.year - 1, month: 11 } : { year: p.year, month: p.month - 1 })}
                className="p-2.5 rounded-lg bg-white/[0.04] border border-white/10 text-arena-smoke hover:text-arena-gold hover:border-arena-gold/30 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h3 className="font-display text-lg uppercase tracking-wider text-arena-gold">{monthLabel}</h3>
              <button
                onClick={() => setCalendarMonth((p) => p.month === 11 ? { year: p.year + 1, month: 0 } : { year: p.year, month: p.month + 1 })}
                className="p-2.5 rounded-lg bg-white/[0.04] border border-white/10 text-arena-smoke hover:text-arena-gold hover:border-arena-gold/30 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => (
                <div key={d} className="text-center text-xs font-bold uppercase tracking-wider text-arena-ash py-2">{d}</div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: getFirstDayOfWeek(calendarMonth.year, calendarMonth.month) }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {Array.from({ length: getDaysInMonth(calendarMonth.year, calendarMonth.month) }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${calendarMonth.year}-${String(calendarMonth.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const dayStreams = streamsForDate(dateStr);
                const isTodayCell = isToday(dateStr);
                const isPastCell = isPast(dateStr);

                return (
                  <div
                    key={day}
                    className={`aspect-square rounded-xl p-1.5 transition-all ${
                      isTodayCell
                        ? "bg-arena-gold/10 border-2 border-arena-gold/40"
                        : dayStreams.length > 0
                          ? "bg-white/[0.04] border border-white/10 hover:border-white/20"
                          : "bg-white/[0.01] border border-transparent"
                    }`}
                  >
                    <div className={`text-xs font-bold ${
                      isTodayCell ? "text-arena-gold" : isPastCell ? "text-arena-ash/40" : "text-arena-smoke"
                    }`}>
                      {day}
                    </div>
                    {dayStreams.length > 0 && (
                      <div className="mt-0.5 space-y-0.5">
                        {dayStreams.slice(0, 2).map((s) => {
                          const cat = CATEGORY_COLORS[s.category] || CATEGORY_COLORS["Outro"];
                          return (
                            <div
                              key={s.id}
                              className={`truncate rounded px-1 py-px text-[10px] leading-tight font-medium ${cat.bg} ${cat.text}`}
                              title={`${s.start_time.slice(0, 5)} — ${s.title}`}
                            >
                              {CATEGORY_ICONS[s.category]} {s.start_time.slice(0, 5)}
                            </div>
                          );
                        })}
                        {dayStreams.length > 2 && (
                          <div className="text-[10px] text-arena-ash text-center">+{dayStreams.length - 2}</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── All Categories Legend ────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {Object.entries(CATEGORY_COLORS).map(([name, c]) => (
          <div key={name} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${c.bg} ${c.text} ${c.border}`}>
            <span>{CATEGORY_ICONS[name]}</span> {name}
          </div>
        ))}
      </div>
    </div>
  );
}
