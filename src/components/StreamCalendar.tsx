"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
   Uses mousedown on element + mousemove/mouseup on document
   so drag keeps working even when cursor leaves the container.
   Touch scrolling is handled natively by overflow-x: scroll.
   ═══════════════════════════════════════════════════════════════ */
function useDragScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const state = useRef({ dragging: false, startX: 0, scrollLeft: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMouseDown = (e: MouseEvent) => {
      state.current = { dragging: true, startX: e.clientX, scrollLeft: el.scrollLeft };
      el.style.cursor = "grabbing";
      e.preventDefault();                 // block text-selection / image-drag
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!state.current.dragging) return;
      const dx = e.clientX - state.current.startX;
      el.scrollLeft = state.current.scrollLeft - dx;
    };

    const onMouseUp = () => {
      if (!state.current.dragging) return;
      state.current.dragging = false;
      el.style.cursor = "grab";
    };

    el.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    return () => {
      el.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
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
          {/* ══ WEEK NAV ══ */}
          <div className="gladiator-nav">
            <button onClick={() => setWeekOffset((o) => o - 1)} className="gladiator-nav__btn" aria-label="Semana anterior">◂</button>
            <button onClick={() => setWeekOffset(0)} className="gladiator-nav__btn gladiator-nav__btn--today" aria-label="Esta semana">HOJE</button>
            <button onClick={() => setWeekOffset((o) => o + 1)} className="gladiator-nav__btn" aria-label="Próxima semana">▸</button>
          </div>

          {/* ══ WEEK ROW ══ */}
          <div ref={scrollRef} className="gladiator-scroll">
            <div className="gladiator-week">
                {weekDates.map((date) => {
                  const dow = new Date(date + "T00:00:00").getDay();
                  const dayStreams = streamsForDate(date);
                  const active = isToday(date);
                  const past = isPast(date);
                  const dayNum = formatDay(date);
                  const month = formatMonth(date);

                  return (
                    <div key={date} {...(active ? { "data-today": "" } : {})} className={`forge-card ${active ? "forge-card--today" : ""} ${past ? "forge-card--past" : ""}`}>
                      {/* ── Forged header ── */}
                      <div className="forge-card__header">
                        <span className="forge-card__day">{DAY_NAMES_PT[dow]}</span>
                        <div className="forge-card__date">
                          <span className="forge-card__num">{dayNum}</span>
                          <span className="forge-card__month">{month}</span>
                        </div>
                      </div>

                      {/* ── Engraved divider ── */}
                      <div className="forge-card__divider">
                        <div className="forge-card__divider-line" />
                        <div className="forge-card__divider-gem" />
                        <div className="forge-card__divider-line" />
                      </div>

                      {/* ── Content ── */}
                      <div className="forge-card__body">
                        {dayStreams.length > 0 ? (
                          dayStreams.map((stream) => {
                            const cats = stream.categories || ["Outro"];
                            return (
                              <div key={stream.id} className={`forge-slot ${stream.is_special ? "forge-slot--special" : ""}`}>
                                <div className="forge-slot__time">
                                  {stream.start_time.slice(0, 5)}
                                  {stream.end_time ? ` – ${stream.end_time.slice(0, 5)}` : ""}
                                </div>
                                <div className="forge-slot__title">{stream.title}</div>
                                <div className="forge-slot__meta">
                                  {cats.map((c) => (
                                    <span key={c} className="forge-slot__icon">{CATEGORY_ICONS[c] || "📺"}</span>
                                  ))}
                                  {stream.casino && <span className="forge-slot__casino">{stream.casino}</span>}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="forge-slot forge-slot--empty">
                            <span className="forge-slot__dash">—</span>
                          </div>
                        )}
                      </div>

                      {/* ── Ember glow at bottom (active day only) ── */}
                      {active && <div className="forge-card__ember" />}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
