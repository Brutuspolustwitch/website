"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { supabase } from "@/lib/supabase";
import type { BonusHuntSession, BonusHuntSlot } from "@/lib/supabase";

/* ═══════════════════════════════════════════════════════════════════
   CORNER ORNAMENT — reused from the papyrus design system
   ═══════════════════════════════════════════════════════════════════ */
function CornerOrnament({ className }: { className: string }) {
  return (
    <svg className={`scroll-ornament ${className}`} viewBox="0 0 24 24" fill="none">
      <path
        d="M2 2 L2 10 M2 2 L10 2 M2 6 L6 2"
        stroke="#8b6914"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="4" cy="4" r="1.5" fill="#8b6914" />
    </svg>
  );
}

export function BonusHuntTracker({ compact = false, hideTitle = false }: { compact?: boolean; hideTitle?: boolean } = {}) {
  const [sessions, setSessions] = useState<BonusHuntSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<BonusHuntSession | null>(null);
  const [slots, setSlots] = useState<BonusHuntSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionIdx, setSessionIdx] = useState(0);
  const [slotPage, setSlotPage] = useState(0);
  const SLOTS_PER_PAGE = 15;

  /* Fetch all completed sessions on mount */
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("bonus_hunt_sessions")
        .select("*")
        .order("hunt_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        setSessions(data);
        setSelectedSession(data[0]);
        setSessionIdx(0);
      }
      setLoading(false);
    }
    load();
  }, []);

  /* Load slots when session changes */
  useEffect(() => {
    if (!selectedSession) return;
    setSlotPage(0);

    async function loadSlots() {
      const { data } = await supabase
        .from("bonus_hunt_slots")
        .select("*")
        .eq("session_id", selectedSession!.id)
        .order("order_index", { ascending: true });

      setSlots(data ?? []);
    }
    loadSlots();
  }, [selectedSession]);

  const currency = selectedSession?.currency || "€";
  const openedCount = slots.filter((s) => s.opened).length;
  const totalSlots = selectedSession?.bonus_count || slots.length;
  const totalPages = Math.max(1, Math.ceil(slots.length / SLOTS_PER_PAGE));
  const paginatedSlots = slots.slice(slotPage * SLOTS_PER_PAGE, (slotPage + 1) * SLOTS_PER_PAGE);

  function prevSession() {
    if (sessionIdx < sessions.length - 1) {
      const next = sessionIdx + 1;
      setSessionIdx(next);
      setSelectedSession(sessions[next]);
    }
  }
  function nextSession() {
    if (sessionIdx > 0) {
      const next = sessionIdx - 1;
      setSessionIdx(next);
      setSelectedSession(sessions[next]);
    }
  }

  if (loading) {
    if (compact) {
      return (
        <div className="papyrus-scroll greek-key-border" style={{ maxWidth: "100%", padding: "32px" }}>
          <div className="animate-pulse space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 rounded" style={{ background: "rgba(139,105,20,0.08)" }} />
            ))}
          </div>
        </div>
      );
    }
    return (
      <section className="relative py-20 px-2 sm:px-4 lg:px-6 bg-arena-dark/50">
        <div className="max-w-7xl mx-auto text-center">
          {!hideTitle && <SectionHeading title="Bonus Hunt" subtitle="A carregar..." />}
          <div className="papyrus-scroll greek-key-border" style={{ maxWidth: "100%", padding: "32px" }}>
            <div className="animate-pulse space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 rounded" style={{ background: "rgba(139,105,20,0.08)" }} />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (sessions.length === 0) {
    if (compact) {
      return (
        <div className="papyrus-scroll greek-key-border" style={{ maxWidth: "100%", padding: "32px", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-display)", color: "var(--ink-light)", fontSize: "0.9rem" }}>
            Sem bonus hunts registados.
          </p>
        </div>
      );
    }
    return (
      <section className="relative py-20 px-2 sm:px-4 lg:px-6 bg-arena-dark/50">
        <div className="max-w-7xl mx-auto text-center">
          {!hideTitle && <SectionHeading title="Bonus Hunt" subtitle="Sem bonus hunts registados" />}
          <div className="papyrus-scroll greek-key-border" style={{ maxWidth: "100%", padding: "32px", textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-display)", color: "var(--ink-light)", fontSize: "0.9rem" }}>
              Os bonus hunts importados aparecerão aqui.
            </p>
          </div>
        </div>
      </section>
    );
  }

  /* ── Inner content (header + papyrus table) ──────────── */
  const openedSlots = slots.filter((s) => s.result != null && s.buy_value > 0);
  const bestSlot = openedSlots.reduce<BonusHuntSlot | null>((best, s) =>
    !best || (s.result! / s.buy_value) > (best.result! / best.buy_value) ? s : best, null);
  const worstSlot = openedSlots.reduce<BonusHuntSlot | null>((worst, s) =>
    !worst || (s.result! / s.buy_value) < (worst.result! / worst.buy_value) ? s : worst, null);

  const tableContent = (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Flex Container: Table on Left, Cards on Right */}
      <div className="bh-layout">
        
        {/* Left Side: Table */}
        <div className="bh-layout-table" style={{ maxWidth: compact ? "100%" : "calc(100% - 344px)" }}>
            {/* ── Hunt Navigation Bar (above card) ──────────── */}
            {!compact && sessions.length > 1 && (
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                marginBottom: "12px",
                gap: "8px",
              }}>
                <button
                  onClick={prevSession}
                  disabled={sessionIdx >= sessions.length - 1}
                  className="bh-nav-btn"
                  style={{ borderColor: "rgba(255,255,255,0.15)", color: "var(--arena-smoke, #e0ddd4)" }}
                  aria-label="Hunt anterior"
                >
                  ‹
                </button>
                <span style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "0.75rem",
                  color: "var(--arena-smoke, #e0ddd4)",
                  letterSpacing: "0.1em",
                }}>
                  Bonus Hunt {sessionIdx + 1} / {sessions.length}
                </span>
                <button
                  onClick={nextSession}
                  disabled={sessionIdx <= 0}
                  className="bh-nav-btn"
                  style={{ borderColor: "rgba(255,255,255,0.15)", color: "var(--arena-smoke, #e0ddd4)" }}
                  aria-label="Próximo hunt"
                >
                  ›
                </button>
              </div>
            )}

            <div className="papyrus-scroll greek-key-border papyrus-scroll-top papyrus-scroll-bottom bonus-hunt-scroll">
              <CornerOrnament className="absolute top-2 left-2 w-5 h-5" />
              <CornerOrnament className="absolute top-2 right-2 w-5 h-5 -scale-x-100" />
              <CornerOrnament className="absolute bottom-2 left-2 w-5 h-5 -scale-y-100" />
              <CornerOrnament className="absolute bottom-2 right-2 w-5 h-5 -scale-x-100 -scale-y-100" />

              {/* ── Stats bar (top) ────────────────────── */}
              <div className="scroll-content" style={{ padding: "18px 20px 0" }}>
                <div className="bh-stats-bar">
                  <div>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: "0.5rem", color: "var(--ink-light)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "2px" }}>Start Money</p>
                    <p style={{ fontFamily: "var(--font-ui)", fontSize: "1rem", fontWeight: 700, color: "var(--ink-dark)" }}>
                      {(selectedSession?.start_money ?? 0).toFixed(2)}{currency}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: "0.5rem", color: "var(--ink-light)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "2px" }}>Total Win</p>
                    <p style={{ fontFamily: "var(--font-ui)", fontSize: "1rem", fontWeight: 700, color: "#2e7d32" }}>
                      {(selectedSession?.total_result ?? 0).toFixed(2)}{currency}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: "0.5rem", color: "var(--ink-light)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "2px" }}>Profit</p>
                    <p style={{
                      fontFamily: "var(--font-ui)",
                      fontSize: "1rem",
                      fontWeight: 700,
                      color: (selectedSession?.profit ?? 0) >= 0 ? "#2e7d32" : "#8b1a1a",
                    }}>
                      {(selectedSession?.profit ?? 0) >= 0 ? "+" : ""}{(selectedSession?.profit ?? 0).toFixed(2)}{currency}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: "0.5rem", color: "var(--ink-light)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "2px" }}>Best Multi</p>
                    <p style={{ fontFamily: "var(--font-ui)", fontSize: "1rem", fontWeight: 700, color: "var(--gold-dark)" }}>
                      {(selectedSession?.best_multi ?? 0).toFixed(1)}x
                    </p>
                  </div>
                  <div>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: "0.5rem", color: "var(--ink-light)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "2px" }}>Avg Multi</p>
                    <p style={{ fontFamily: "var(--font-ui)", fontSize: "1rem", fontWeight: 700, color: "var(--ink-dark)" }}>
                      {(selectedSession?.avg_multi ?? 0).toFixed(1)}x
                    </p>
                  </div>
                </div>

                {/* Best slot callout (full page only) */}
                {!compact && selectedSession?.best_slot_name && (
                  <div style={{ textAlign: "center", padding: "4px 0" }}>
                    <span style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "0.6rem",
                      color: "var(--gold-dark)",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                    }}>
                      🏆 Melhor Slot: {selectedSession.best_slot_name} ({selectedSession.best_multi.toFixed(1)}x)
                    </span>
                  </div>
                )}

                {/* ── Column headers ──────────────────── */}
                <div className="bh-table-header">
                  <span className="bh-col-num">#</span>
                  <span className="bh-col-slot">SLOT</span>
                  <span className="bh-col-bet">BET SIZE</span>
                  <span className="bh-col-special">SPECIAL</span>
                  <span className="bh-col-win">WINNINGS</span>
                </div>
              </div>

              {/* ── Slot rows ────────────────────────── */}
              <div className="scroll-content" style={{ padding: "0 20px 8px" }}>
                {(compact ? paginatedSlots : slots).map((slot, i) => {
                  const globalIndex = compact ? slotPage * SLOTS_PER_PAGE + i : i;
                  const multi = slot.bet_size && slot.bet_size > 0 && slot.payout
                    ? (slot.payout / slot.bet_size)
                    : null;
                  const isWin = slot.payout !== undefined && slot.payout !== null && slot.payout >= (slot.bet_size ?? slot.buy_value);

                  return (
                    <div
                      key={slot.id}
                      className={`bh-table-row ${slot.status === "active" ? "bh-row-active" : ""}`}
                    >
                      {/* # */}
                      <span className="bh-col-num" style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        color: "var(--ink-light)",
                      }}>
                        #{globalIndex + 1}
                      </span>

                      {/* Slot: thumbnail + name + provider */}
                      <div className="bh-col-slot" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        {slot.thumbnail_url ? (
                          <img
                            src={slot.thumbnail_url}
                            alt={slot.name}
                            loading="lazy"
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "6px",
                              objectFit: "cover",
                              border: "1px solid rgba(139,105,20,0.2)",
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <div style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "6px",
                            background: "rgba(139,105,20,0.08)",
                            border: "1px solid rgba(139,105,20,0.15)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.9rem",
                            flexShrink: 0,
                          }}>
                            🎰
                          </div>
                        )}
                        <div style={{ minWidth: 0 }}>
                          <p style={{
                            fontFamily: "var(--font-ui)",
                            fontSize: "0.85rem",
                            fontWeight: 700,
                            color: "var(--ink-dark)",
                            lineHeight: 1.2,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}>
                            {slot.name}
                          </p>
                          {slot.provider && (
                            <p style={{
                              fontFamily: "var(--font-display)",
                              fontSize: "0.55rem",
                              color: "var(--ink-light)",
                              letterSpacing: "0.1em",
                              textTransform: "uppercase",
                              lineHeight: 1.4,
                            }}>
                              {slot.provider}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Bet size */}
                      <span className="bh-col-bet" style={{
                        fontFamily: "var(--font-ui)",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        color: "var(--ink-dark)",
                      }}>
                        {(slot.bet_size ?? slot.buy_value).toFixed(2)}{currency}
                      </span>

                      {/* Special badges */}
                      <div className="bh-col-special" style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                        {slot.is_super_bonus && (
                          <span className="bh-badge bh-badge-super">SUPER BÓNUS</span>
                        )}
                        {slot.is_extreme_bonus && (
                          <span className="bh-badge bh-badge-extreme">EXTREME</span>
                        )}
                      </div>

                      {/* Winnings */}
                      <span className="bh-col-win" style={{
                        fontFamily: "var(--font-ui)",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        color: !slot.opened
                          ? "var(--ink-light)"
                          : isWin ? "#2e7d32" : "#8b1a1a",
                      }}>
                        {slot.opened && slot.payout !== undefined && slot.payout !== null
                          ? <>
                              {slot.payout.toFixed(2)}{currency}
                              {multi !== null && (
                                <span style={{ fontSize: "0.65rem", fontWeight: 400, color: "var(--ink-light)", marginLeft: "4px" }}>
                                  ({multi.toFixed(1)}x)
                                </span>
                              )}
                            </>
                          : <span style={{ fontFamily: "var(--font-display)", letterSpacing: "0.1em" }}>???</span>
                        }
                      </span>
                    </div>
                  );
                })}

                {/* ── Pagination controls ──────────── */}
                {compact && totalPages > 1 && (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    gap: "8px",
                    padding: "12px 0 4px",
                    borderTop: "1px solid rgba(139,105,20,0.15)",
                    marginTop: "8px",
                  }}>
                    <button
                      onClick={() => setSlotPage((p) => Math.max(0, p - 1))}
                      disabled={slotPage === 0}
                      className="bh-nav-btn"
                      style={{ borderColor: "rgba(139,105,20,0.25)", color: "var(--ink-dark)", opacity: slotPage === 0 ? 0.3 : 1 }}
                      aria-label="Página anterior"
                    >
                      ‹
                    </button>
                    {Array.from({ length: totalPages }, (_, p) => (
                      <button
                        key={p}
                        onClick={() => setSlotPage(p)}
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "0.7rem",
                          fontWeight: slotPage === p ? 700 : 500,
                          width: "28px",
                          height: "28px",
                          borderRadius: "4px",
                          border: slotPage === p ? "1px solid rgba(139,105,20,0.5)" : "1px solid rgba(139,105,20,0.15)",
                          background: slotPage === p ? "rgba(139,105,20,0.15)" : "transparent",
                          color: slotPage === p ? "var(--gold-dark)" : "var(--ink-light)",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {p + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setSlotPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={slotPage === totalPages - 1}
                      className="bh-nav-btn"
                      style={{ borderColor: "rgba(139,105,20,0.25)", color: "var(--ink-dark)", opacity: slotPage === totalPages - 1 ? 0.3 : 1 }}
                      aria-label="Próxima página"
                    >
                      ›
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

        {/* Right Side: Best & Worst Slot Cards */}
        {!compact && (bestSlot || worstSlot) && (
          <div className="bh-layout-sidebar">
            
            {/* Best Slot Card */}
            {bestSlot && (
              <motion.div
                className="papyrus-scroll greek-key-border papyrus-scroll-top papyrus-scroll-bottom"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                style={{ position: "relative", overflow: "visible" }}
              >
                <CornerOrnament className="absolute top-2 left-2 w-4 h-4" />
                <CornerOrnament className="absolute top-2 right-2 w-4 h-4 -scale-x-100" />
                <CornerOrnament className="absolute bottom-2 left-2 w-4 h-4 -scale-y-100" />
                <CornerOrnament className="absolute bottom-2 right-2 w-4 h-4 -scale-x-100 -scale-y-100" />

                <div className="scroll-content" style={{ display: "flex", gap: "12px" }}>
                  {/* Image on left */}
                  <div style={{ flexShrink: 0, width: "90px", position: "relative" }}>
                    <div style={{ position: "absolute", top: -4, left: -4, zIndex: 2 }}>
                      <div style={{
                        background: "linear-gradient(135deg, #2e7d32, #1b5e20)",
                        color: "#fff",
                        padding: "3px 6px",
                        borderRadius: "4px",
                        fontFamily: "var(--font-display)",
                        fontSize: "0.4rem",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        fontWeight: 700,
                        boxShadow: "0 2px 8px rgba(46,125,50,0.3)",
                      }}>
                        🏆 A Bruta
                      </div>
                    </div>
                    <div style={{ aspectRatio: "3/4", background: "#000", borderRadius: "6px", overflow: "hidden", border: "2px solid rgba(46,125,50,0.3)" }}>
                      {bestSlot.thumbnail_url ? (
                        <img
                          src={bestSlot.thumbnail_url}
                          alt={bestSlot.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <div style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)",
                          fontSize: "2rem",
                        }}>
                          🎰
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content on right */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px", paddingTop: "4px" }}>
                    <div>
                      <h3 style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "var(--ink-dark)",
                        marginBottom: "2px",
                        lineHeight: 1.2,
                      }}>
                        {bestSlot.name}
                      </h3>
                      {bestSlot.provider && (
                        <p style={{
                          fontFamily: "var(--font-ui)",
                          fontSize: "0.5rem",
                          color: "var(--ink-light)",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                        }}>
                          {bestSlot.provider}
                        </p>
                      )}
                    </div>

                    {/* Stats */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "2px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "3px", borderBottom: "1px solid rgba(139,105,20,0.12)" }}>
                        <span style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "0.45rem",
                          color: "var(--ink-light)",
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                        }}>
                          Payout
                        </span>
                        <span style={{
                          fontFamily: "var(--font-ui)",
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          color: "#2e7d32",
                        }}>
                          {(bestSlot.result ?? 0).toFixed(2)}{currency}
                        </span>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "3px", borderBottom: "1px solid rgba(139,105,20,0.12)" }}>
                        <span style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "0.45rem",
                          color: "var(--ink-light)",
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                        }}>
                          Bet Size
                        </span>
                        <span style={{
                          fontFamily: "var(--font-ui)",
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          color: "var(--ink-dark)",
                        }}>
                          {bestSlot.buy_value.toFixed(2)}{currency}
                        </span>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "0.45rem",
                          color: "var(--ink-light)",
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                        }}>
                          Multi
                        </span>
                        <span style={{
                          fontFamily: "var(--font-ui)",
                          fontSize: "1rem",
                          fontWeight: 700,
                          color: "#2e7d32",
                        }}>
                          {((bestSlot.result ?? 0) / bestSlot.buy_value).toFixed(1)}x
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Worst Slot Card */}
            {worstSlot && (
              <motion.div
                className="papyrus-scroll greek-key-border papyrus-scroll-top papyrus-scroll-bottom"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                style={{ position: "relative", overflow: "visible" }}
              >
                <CornerOrnament className="absolute top-2 left-2 w-4 h-4" />
                <CornerOrnament className="absolute top-2 right-2 w-4 h-4 -scale-x-100" />
                <CornerOrnament className="absolute bottom-2 left-2 w-4 h-4 -scale-y-100" />
                <CornerOrnament className="absolute bottom-2 right-2 w-4 h-4 -scale-x-100 -scale-y-100" />

                <div className="scroll-content" style={{ display: "flex", gap: "12px" }}>
                  {/* Image on left */}
                  <div style={{ flexShrink: 0, width: "90px", position: "relative" }}>
                    <div style={{ position: "absolute", top: -4, left: -4, zIndex: 2 }}>
                      <div style={{
                        background: "linear-gradient(135deg, #8b1a1a, #5d1111)",
                        color: "#fff",
                        padding: "3px 6px",
                        borderRadius: "4px",
                        fontFamily: "var(--font-display)",
                        fontSize: "0.4rem",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        fontWeight: 700,
                        boxShadow: "0 2px 8px rgba(139,26,26,0.3)",
                      }}>
                        💀 A Tenebrosa
                      </div>
                    </div>
                    <div style={{ aspectRatio: "3/4", background: "#000", borderRadius: "6px", overflow: "hidden", border: "2px solid rgba(139,26,26,0.3)" }}>
                      {worstSlot.thumbnail_url ? (
                        <img
                          src={worstSlot.thumbnail_url}
                          alt={worstSlot.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <div style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "linear-gradient(135deg, #8b1a1a 0%, #5d1111 100%)",
                          fontSize: "2rem",
                        }}>
                          🎰
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content on right */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px", paddingTop: "4px" }}>
                    <div>
                      <h3 style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "var(--ink-dark)",
                        marginBottom: "2px",
                        lineHeight: 1.2,
                      }}>
                        {worstSlot.name}
                      </h3>
                      {worstSlot.provider && (
                        <p style={{
                          fontFamily: "var(--font-ui)",
                          fontSize: "0.5rem",
                          color: "var(--ink-light)",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                        }}>
                          {worstSlot.provider}
                        </p>
                      )}
                    </div>

                    {/* Stats */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "2px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "3px", borderBottom: "1px solid rgba(139,105,20,0.12)" }}>
                        <span style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "0.45rem",
                          color: "var(--ink-light)",
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                        }}>
                          Payout
                        </span>
                        <span style={{
                          fontFamily: "var(--font-ui)",
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          color: "#8b1a1a",
                        }}>
                          {(worstSlot.result ?? 0).toFixed(2)}{currency}
                        </span>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "3px", borderBottom: "1px solid rgba(139,105,20,0.12)" }}>
                        <span style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "0.45rem",
                          color: "var(--ink-light)",
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                        }}>
                          Bet Size
                        </span>
                        <span style={{
                          fontFamily: "var(--font-ui)",
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          color: "var(--ink-dark)",
                        }}>
                          {worstSlot.buy_value.toFixed(2)}{currency}
                        </span>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "0.45rem",
                          color: "var(--ink-light)",
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                        }}>
                          Multi
                        </span>
                        <span style={{
                          fontFamily: "var(--font-ui)",
                          fontSize: "1rem",
                          fontWeight: 700,
                          color: "#8b1a1a",
                        }}>
                          {((worstSlot.result ?? 0) / worstSlot.buy_value).toFixed(1)}x
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );

  /* Compact mode: skip section wrapper */
  if (compact) {
    return tableContent;
  }

  /* Full page mode */
  return (
    <section id="bonus-hunt" className="relative py-10 sm:py-20 px-2 sm:px-4 lg:px-6 overflow-hidden">

      <div className="relative max-w-7xl mx-auto">
        {!hideTitle && (
        <ScrollReveal>
          <SectionHeading
            title="Bonus Hunt"
            subtitle={selectedSession?.title || "Acompanha cada bónus em tempo real"}
          />
        </ScrollReveal>
        )}
        <ScrollReveal delay={0.1}>
          {tableContent}
        </ScrollReveal>
      </div>
    </section>
  );
}
