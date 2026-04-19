"use client";

import { useState, useEffect, useCallback } from "react";
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

/* ── 7 days centered on today (3 past + today + 3 future) ── */
function getCenteredDates(): string[] {
  const now = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() + (i - 3));
    return d.toISOString().split("T")[0];
  });
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export function StreamCalendar() {
  const [streams, setStreams] = useState<ScheduledStreamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStream, setSelectedStream] = useState<ScheduledStreamRow | null>(null);

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

  const dates = getCenteredDates();
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
        <div className="gladiator-schedule__overlay">
          <div className="gladiator-week">
            {dates.map((date) => {
              const dow = new Date(date + "T00:00:00").getDay();
              const dayStreams = streamsForDate(date);
              const active = isToday(date);
              const past = isPast(date);
              const dayNum = formatDay(date);
              const month = formatMonth(date);

              return (
                <div key={date} className={`forge-card ${active ? "forge-card--today" : ""} ${past ? "forge-card--past" : ""}`}>
                  <div className="forge-card__header">
                    <span className="forge-card__day">{DAY_NAMES_PT[dow]}</span>
                    <div className="forge-card__date">
                      <span className="forge-card__num">{dayNum}</span>
                      <span className="forge-card__month">{month}</span>
                    </div>
                  </div>

                  <div className="forge-card__divider" />

                  <div className="forge-card__body">
                    {dayStreams.length > 0 ? (
                      dayStreams.map((stream) => {
                        const cats = stream.categories || ["Outro"];
                        return (
                          <div
                            key={stream.id}
                            className={`forge-slot ${stream.is_special ? "forge-slot--special" : ""}`}
                            style={{ cursor: "pointer" }}
                            onClick={() => setSelectedStream(stream)}
                          >
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
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal Pop-out for Stream Details */}
      {selectedStream && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setSelectedStream(null)}
        >
          <div
            className="bg-arena-dark border-2 border-arena-gold rounded-xl p-8 max-w-md w-full relative shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 text-arena-gold hover:text-white text-2xl"
              onClick={() => setSelectedStream(null)}
              aria-label="Fechar"
            >
              ×
            </button>
            <div className="flex flex-col gap-2 items-center">
              <div className="text-lg font-bold text-arena-gold mb-2">{selectedStream.title}</div>
              <div className="flex gap-2 items-center mb-2">
                <span className="text-sm bg-arena-gold/10 px-2 py-1 rounded">
                  {selectedStream.stream_date} {selectedStream.start_time.slice(0,5)}
                  {selectedStream.end_time ? ` – ${selectedStream.end_time.slice(0,5)}` : ""}
                </span>
                {selectedStream.casino && (
                  <span className="text-sm bg-arena-gold/10 px-2 py-1 rounded">
                    {selectedStream.casino}
                  </span>
                )}
              </div>
              <div className="flex gap-2 mb-2">
                {(selectedStream.categories || ["Outro"]).map((c) => (
                  <span key={c} className="text-2xl">{CATEGORY_ICONS[c] || "📺"}</span>
                ))}
              </div>
              {selectedStream.description && (
                <div className="text-sm text-arena-gold/80 mb-2 text-center">
                  {selectedStream.description}
                </div>
              )}
              {Array.isArray((selectedStream as any).links) && (selectedStream as any).links.length > 0 && (
                <div className="flex flex-col gap-1 mt-2 w-full">
                  <div className="font-semibold text-arena-gold">Links:</div>
                  {(selectedStream as any).links.map((link: any, idx: number) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-arena-gold underline hover:text-white"
                    >
                      {link.label || link.url}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
