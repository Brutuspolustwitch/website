"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import type { ScheduledStreamRow } from "@/lib/supabase";

/* ── Category icons ────────────────────────────────────────── */
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

/* ── Helpers ───────────────────────────────────────────────── */
const formatDay = (dateStr: string) => new Date(dateStr + "T00:00:00").getDate();

const formatMonth = (dateStr: string) =>
  new Date(dateStr + "T00:00:00").toLocaleDateString("pt-PT", { month: "short" }).toUpperCase();

const isToday = (dateStr: string) => dateStr === new Date().toISOString().split("T")[0];
const isPast = (dateStr: string) => dateStr < new Date().toISOString().split("T")[0];

/* ── Get current week dates (Mon–Sun) ──────────────────────── */
function getWeekDates(offset = 0): string[] {
  const now = new Date();
  const dayOfWeek = (now.getDay() + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek + offset * 7);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}

/* ═══════════════════════════════════════════════════════════════
   DRAG SCROLL HOOK
   ═══════════════════════════════════════════════════════════════ */
function useDragScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onDown = (e: PointerEvent) => {
      isDragging.current = true;
      startX.current = e.pageX - el.offsetLeft;
      scrollLeft.current = el.scrollLeft;
      el.style.cursor = "grabbing";
      el.setPointerCapture(e.pointerId);
    };

    const onMove = (e: PointerEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      el.scrollLeft = scrollLeft.current - (x - startX.current);
    };

    const onUp = () => {
      isDragging.current = false;
      el.style.cursor = "grab";
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);

    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
    };
  }, []);

  return ref;
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export function StreamCalendar() {
  const [streams, setStreams] = useState<ScheduledStreamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const scrollRef = useDragScroll();

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-arena-gold/30 border-t-arena-gold rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="gladiator-schedule">
      <div className="gladiator-schedule__poster">
        <img
          src="/images/schedule.jpg"
          alt=""
          className="gladiator-schedule__bg"
          draggable={false}
        />

        <div className="gladiator-schedule__overlay">
          {/* ══ DRAG-SCROLLABLE WEEK ROW ══ */}
          <div ref={scrollRef} className="gladiator-scroll">
            <AnimatePresence mode="wait">
              <motion.div
                key={weekOffset}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="gladiator-week"
              >
                {weekDates.map((date) => {
                  const dow = new Date(date + "T00:00:00").getDay();
                  const dayStreams = streamsForDate(date);
                  const active = isToday(date);
                  const past = isPast(date);
                  const dayNum = formatDay(date);
                  const month = formatMonth(date);

                  return (
                    <div key={date} className={`stone-card ${active ? "stone-card--today" : ""} ${past ? "stone-card--past" : ""}`}>
                      {/* ── Stone tablet header ── */}
                      <div className="stone-card__header">
                        <span className="stone-card__day">{DAY_NAMES_PT[dow]}</span>
                        <div className="stone-card__date">
                          <span className="stone-card__num">{dayNum}</span>
                          <span className="stone-card__month">{month}</span>
                        </div>
                        {active && <div className="stone-card__active-mark" />}
                      </div>

                      {/* ── Chisel line ── */}
                      <div className="stone-card__chisel" />

                      {/* ── Content ── */}
                      <div className="stone-card__body">
                        {dayStreams.length > 0 ? (
                          dayStreams.map((stream) => {
                            const cats = stream.categories || ["Outro"];
                            return (
                              <div key={stream.id} className={`stone-slot ${stream.is_special ? "stone-slot--special" : ""}`}>
                                <div className="stone-slot__time">
                                  {stream.start_time.slice(0, 5)}
                                  {stream.end_time ? ` – ${stream.end_time.slice(0, 5)}` : ""}
                                </div>
                                <div className="stone-slot__title">{stream.title}</div>
                                <div className="stone-slot__meta">
                                  {cats.map((c) => (
                                    <span key={c} className="stone-slot__icon">{CATEGORY_ICONS[c] || "📺"}</span>
                                  ))}
                                  {stream.casino && <span className="stone-slot__casino">{stream.casino}</span>}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="stone-slot stone-slot--empty">
                            <span className="stone-slot__dash">—</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
