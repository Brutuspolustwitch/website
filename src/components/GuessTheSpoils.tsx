"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase, type BonusHuntSession, type BonusHuntSlot } from "@/lib/supabase";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

/* ── Helpers ────────────────────────────────────────────────────────── */

function toRoman(n: number): string {
  const lookup: [number, string][] = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
    [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let result = "";
  let remaining = n;
  for (const [value, symbol] of lookup) {
    while (remaining >= value) {
      result += symbol;
      remaining -= value;
    }
  }
  return result;
}

function CornerOrnament({ className }: { className: string }) {
  return (
    <svg className={`scroll-ornament ${className}`} viewBox="0 0 24 24" fill="none">
      <path d="M2 2 L2 10 M2 2 L10 2 M2 6 L6 2" stroke="#8b6914" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="4" cy="4" r="1.5" fill="#8b6914" />
    </svg>
  );
}

type StatsTab = "war-stats" | "treasury" | "favor" | "records";

/* ── Component ──────────────────────────────────────────────────────── */

export function GuessTheSpoils() {
  const [campaigns, setCampaigns] = useState<BonusHuntSession[]>([]);
  const [idx, setIdx] = useState(0);
  const [slots, setSlots] = useState<BonusHuntSlot[]>([]);
  const [tab, setTab] = useState<StatsTab>("war-stats");
  const [loading, setLoading] = useState(true);

  /* Fetch all campaigns */
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("bonus_hunt_sessions")
        .select("*")
        .order("created_at", { ascending: false });
      if (data?.length) setCampaigns(data as BonusHuntSession[]);
      setLoading(false);
    })();
  }, []);

  /* Fetch slots for active campaign */
  const campaign = campaigns[idx];
  useEffect(() => {
    if (!campaign) return;
    (async () => {
      const { data } = await supabase
        .from("bonus_hunt_slots")
        .select("*")
        .eq("session_id", campaign.id)
        .order("order_index", { ascending: true });
      if (data) setSlots(data as BonusHuntSlot[]);
    })();
  }, [campaign]);

  /* Derived stats */
  const victories = slots.filter((s) => s.status === "completed" && (s.result ?? 0) > 0).length;
  const total = slots.length;
  const totalWin = slots.reduce((s, r) => s + (r.result ?? 0), 0);
  const totalBuy = slots.reduce((s, r) => s + r.buy_value, 0);
  const currentBE = totalBuy > 0 ? totalWin / totalBuy : 0;
  const progress = total > 0 ? (victories / total) * 100 : 0;

  const statusLabel =
    campaign?.status === "active" ? "EM BATALHA" :
    campaign?.status === "completed" ? "COMPLETA" : "PRÓXIMA";

  /* ── Render ──────────────────────────────────────────────────────── */

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 min-h-screen bg-arena-dark/50">
      {/* Background */}
      <div
        className="absolute inset-0 opacity-[0.06] bg-cover bg-right-bottom pointer-events-none"
        style={{ backgroundImage: "url('/images/pages/warrior-illustration.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-arena-dark via-arena-dark/85 to-arena-dark/70 pointer-events-none" />

      <div className="relative max-w-[1400px] mx-auto">

        {/* ── Heading ──────────────────────────────────────────────── */}
        <ScrollReveal>
          <SectionHeading
            title="Guess the Spoils"
            subtitle="Survive the Arena and Claim Your Glory!"
          />
        </ScrollReveal>

        {/* ── Loading / Empty ──────────────────────────────────────── */}
        {loading ? (
          <div className="papyrus-scroll greek-key-border" style={{ maxWidth: "100%", padding: "32px", textAlign: "center" }}>
            <div className="animate-pulse space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 rounded" style={{ background: "rgba(139,105,20,0.08)" }} />
              ))}
            </div>
          </div>
        ) : !campaign ? (
          <div className="papyrus-scroll greek-key-border" style={{ maxWidth: "100%", padding: "32px", textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-display)", color: "var(--ink-light)", fontSize: "0.9rem" }}>
              Nenhuma campanha ativa. As campanhas aparecem aqui durante os Bonus Hunts.
            </p>
          </div>
        ) : (

        /* ── Main Grid ─────────────────────────────────────────────── */
        <ScrollReveal delay={0.1}>
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">

            {/* ▸ LEFT — Campaign Table (Papyrus) ──────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <div className="papyrus-scroll greek-key-border papyrus-scroll-top papyrus-scroll-bottom gts-scroll">
                <CornerOrnament className="absolute top-2 left-2 w-5 h-5" />
                <CornerOrnament className="absolute top-2 right-2 w-5 h-5 -scale-x-100" />
                <CornerOrnament className="absolute bottom-2 left-2 w-5 h-5 -scale-y-100" />
                <CornerOrnament className="absolute bottom-2 right-2 w-5 h-5 -scale-x-100 -scale-y-100" />

                {/* Campaign header bar */}
                <div className="scroll-content" style={{ padding: "10px 20px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "1.3rem" }}>🛡️</span>
                      <span style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "1.1rem",
                        fontWeight: 700,
                        color: "var(--ink-dark)",
                        letterSpacing: "0.08em",
                      }}>
                        Campaign {toRoman(idx + 1)}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {campaigns.length > 1 && (
                        <>
                          <button
                            onClick={() => setIdx((p) => Math.max(0, p - 1))}
                            disabled={idx === 0}
                            className="bh-nav-btn"
                            aria-label="Campanha anterior"
                          >‹</button>
                          <button
                            onClick={() => setIdx((p) => Math.min(campaigns.length - 1, p + 1))}
                            disabled={idx === campaigns.length - 1}
                            className="bh-nav-btn"
                            aria-label="Próxima campanha"
                          >›</button>
                        </>
                      )}
                      <span style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "0.65rem",
                        fontWeight: 600,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        padding: "4px 10px",
                        borderRadius: "4px",
                        background: campaign.status === "active"
                          ? "rgba(34,197,94,0.15)"
                          : "rgba(139,105,20,0.12)",
                        color: campaign.status === "active"
                          ? "#22c55e"
                          : "var(--gold-dark)",
                        border: `1px solid ${campaign.status === "active" ? "rgba(34,197,94,0.3)" : "rgba(139,105,20,0.2)"}`,
                      }}>
                        {statusLabel}
                      </span>
                      <span style={{
                        fontFamily: "var(--font-ui)",
                        fontSize: "0.75rem",
                        color: "var(--ink-light)",
                      }}>
                        {victories} / {total} Victories
                      </span>
                    </div>
                  </div>

                  {/* Column headers */}
                  <div className="bh-table-header" style={{ gridTemplateColumns: "40px 1fr 80px 80px 120px 100px" }}>
                    <span>#</span>
                    <span>SLOT (BATTLE)</span>
                    <span>BET SIZE</span>
                    <span>VOTES</span>
                    <span>SPECIAL</span>
                    <span style={{ textAlign: "right" }}>WINNINGS</span>
                  </div>
                </div>

                {/* Slot rows */}
                <div className="scroll-content" style={{ padding: "0 20px 8px" }}>
                  {slots.map((slot, i) => (
                    <motion.div
                      key={slot.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="bh-table-row"
                      style={{ gridTemplateColumns: "40px 1fr 80px 80px 120px 100px" }}
                    >
                      {/* # */}
                      <span style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        color: "var(--ink-light)",
                        textAlign: "center",
                      }}>
                        #{i + 1}
                      </span>

                      {/* Slot info */}
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
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
                            ⚔
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
                      <span style={{
                        fontFamily: "var(--font-ui)",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        color: "var(--ink-dark)",
                        textAlign: "center",
                      }}>
                        {slot.buy_value.toFixed(2)}€
                      </span>

                      {/* Votes */}
                      <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                        <span style={{
                          width: "24px",
                          height: "24px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "4px",
                          border: "1px solid rgba(139,105,20,0.15)",
                          background: "rgba(139,105,20,0.05)",
                          fontSize: "0.6rem",
                          color: "var(--ink-light)",
                        }}>⚔</span>
                        <span style={{
                          width: "24px",
                          height: "24px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "4px",
                          border: "1px solid rgba(139,105,20,0.15)",
                          background: "rgba(139,105,20,0.05)",
                          fontSize: "0.6rem",
                          color: "var(--ink-light)",
                        }}>⚙</span>
                      </div>

                      {/* Special */}
                      <div style={{ display: "flex", gap: "4px", justifyContent: "center", flexWrap: "wrap" }}>
                        {slot.is_super_bonus && (
                          <span className="bh-badge bh-badge-super">SUPER BÓNUS</span>
                        )}
                        {slot.is_extreme_bonus && (
                          <span className="bh-badge bh-badge-extreme">EXTREME</span>
                        )}
                        {slot.special && !slot.is_super_bonus && !slot.is_extreme_bonus && (
                          <span className="bh-badge bh-badge-super">{slot.special}</span>
                        )}
                      </div>

                      {/* Winnings */}
                      <span style={{
                        fontFamily: "var(--font-ui)",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        textAlign: "right",
                        color: slot.result != null
                          ? (slot.result >= slot.buy_value ? "#2e7d32" : "#8b1a1a")
                          : "var(--ink-light)",
                      }}>
                        {slot.result != null
                          ? <>{slot.result.toFixed(2)}€
                              {slot.buy_value > 0 && (
                                <span style={{ fontSize: "0.65rem", fontWeight: 400, color: "var(--ink-light)", marginLeft: "4px" }}>
                                  ({(slot.result / slot.buy_value).toFixed(1)}x)
                                </span>
                              )}
                            </>
                          : <span style={{ fontFamily: "var(--font-display)", letterSpacing: "0.1em" }}>—</span>
                        }
                      </span>
                    </motion.div>
                  ))}

                  {slots.length === 0 && (
                    <div style={{ padding: "32px 0", textAlign: "center" }}>
                      <p style={{ fontFamily: "var(--font-display)", color: "var(--ink-light)", fontSize: "0.85rem" }}>
                        Nenhum slot nesta campanha.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* ▸ RIGHT — War Stats (Papyrus) ──────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
              className="self-start"
            >
              <div className="papyrus-scroll greek-key-border papyrus-scroll-top papyrus-scroll-bottom gts-stats-scroll">
                <CornerOrnament className="absolute top-2 left-2 w-5 h-5" />
                <CornerOrnament className="absolute top-2 right-2 w-5 h-5 -scale-x-100" />
                <CornerOrnament className="absolute bottom-2 left-2 w-5 h-5 -scale-y-100" />
                <CornerOrnament className="absolute bottom-2 right-2 w-5 h-5 -scale-x-100 -scale-y-100" />

                {/* Tabs */}
                <div className="scroll-content" style={{
                  display: "flex",
                  borderBottom: "2px solid rgba(139,105,20,0.15)",
                }}>
                  {([
                    { id: "war-stats", label: "War Stats", icon: "📊" },
                    { id: "treasury", label: "Treasury", icon: "💰" },
                    { id: "favor", label: "Favor", icon: "⭐" },
                    { id: "records", label: "Records", icon: "🕐" },
                  ] as { id: StatsTab; label: string; icon: string }[]).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "2px",
                        padding: "10px 4px",
                        fontFamily: "var(--font-display)",
                        fontSize: "0.5rem",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: tab === t.id ? "var(--ink-dark)" : "var(--ink-light)",
                        background: tab === t.id ? "rgba(139,105,20,0.06)" : "transparent",
                        border: "none",
                        borderBottom: tab === t.id ? "2px solid var(--gold-dark)" : "2px solid transparent",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      <span style={{ fontSize: "0.85rem" }}>{t.icon}</span>
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div className="scroll-content" style={{ padding: "12px 16px 16px" }}>

                  {/* WAR STATS */}
                  {tab === "war-stats" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {/* Start / Stop / Target */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                        <StatBox icon="⚔" label="Start" value={`${campaign.start_money.toFixed(2)}€`} />
                        <StatBox icon="⭕" label="Stop" value={`${campaign.stop_loss.toFixed(2)}€`} />
                        <StatBox icon="🎯" label="Target" value={`${(campaign.total_result ?? 0).toFixed(2)}€`} highlight />
                      </div>

                      {/* Campaign progress */}
                      <div style={{
                        border: "1px solid rgba(139,105,20,0.15)",
                        borderRadius: "6px",
                        padding: "10px",
                        background: "rgba(139,105,20,0.04)",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                          <span style={{ fontFamily: "var(--font-display)", fontSize: "0.5rem", color: "var(--ink-light)", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600 }}>
                            Campaign Progress
                          </span>
                          <span style={{
                            fontSize: "0.55rem",
                            fontWeight: 700,
                            padding: "2px 6px",
                            borderRadius: "3px",
                            background: "rgba(34,197,94,0.12)",
                            color: "#22c55e",
                          }}>
                            {victories}/{total}
                          </span>
                        </div>
                        <div style={{
                          height: "6px",
                          borderRadius: "3px",
                          background: "rgba(139,105,20,0.1)",
                          overflow: "hidden",
                        }}>
                          <motion.div
                            style={{
                              height: "100%",
                              borderRadius: "3px",
                              background: "linear-gradient(90deg, var(--gold-dark), #b89230)",
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, delay: 0.3 }}
                          />
                        </div>
                      </div>

                      {/* Current BE */}
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "6px 4px",
                      }}>
                        <span style={{ fontFamily: "var(--font-display)", fontSize: "0.55rem", color: "var(--ink-light)", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600 }}>
                          ⚡ Current BE
                        </span>
                        <span style={{ fontFamily: "var(--font-ui)", fontSize: "1.2rem", fontWeight: 700, color: "var(--ink-dark)" }}>
                          {currentBE.toFixed(2)}x
                        </span>
                      </div>

                      {/* Initial BE */}
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "6px 4px",
                        borderTop: "1px solid rgba(139,105,20,0.12)",
                      }}>
                        <span style={{ fontFamily: "var(--font-display)", fontSize: "0.55rem", color: "var(--ink-light)", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600 }}>
                          ○ Initial BE
                        </span>
                        <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.9rem", fontWeight: 700, color: "var(--ink-dark)" }}>
                          1.00x
                        </span>
                      </div>
                    </div>
                  )}

                  {/* TREASURY */}
                  {tab === "treasury" && (
                    <div style={{ padding: "24px 0", textAlign: "center" }}>
                      <p style={{ fontFamily: "var(--font-display)", fontSize: "0.55rem", color: "var(--ink-light)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "4px" }}>
                        💰 Total Winnings
                      </p>
                      <p style={{ fontFamily: "var(--font-ui)", fontSize: "1.8rem", fontWeight: 700, color: "var(--gold-dark)", marginBottom: "6px" }}>
                        {totalWin.toFixed(2)}€
                      </p>
                      <p style={{ fontFamily: "var(--font-display)", fontSize: "0.55rem", color: "var(--ink-light)", letterSpacing: "0.1em", marginBottom: "4px" }}>
                        Total Buy: {totalBuy.toFixed(2)}€
                      </p>
                      <p style={{
                        fontFamily: "var(--font-ui)",
                        fontSize: "0.9rem",
                        fontWeight: 700,
                        color: totalWin >= totalBuy ? "#2e7d32" : "#8b1a1a",
                      }}>
                        {totalWin >= totalBuy ? "+" : ""}{(totalWin - totalBuy).toFixed(2)}€
                      </p>
                    </div>
                  )}

                  {/* FAVOR */}
                  {tab === "favor" && (
                    <div style={{ padding: "24px 0", textAlign: "center" }}>
                      <p style={{ fontFamily: "var(--font-display)", fontSize: "0.8rem", color: "var(--ink-light)" }}>
                        Votação em breve.
                      </p>
                    </div>
                  )}

                  {/* RECORDS */}
                  {tab === "records" && (
                    <div style={{ padding: "24px 0", textAlign: "center" }}>
                      <p style={{ fontFamily: "var(--font-display)", fontSize: "0.8rem", color: "var(--ink-light)" }}>
                        Histórico em breve.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </ScrollReveal>
        )}
      </div>
    </section>
  );
}

/* ── Small stat box (papyrus style) ────────────────────────────────── */

function StatBox({
  icon, label, value, highlight = false,
}: {
  icon: string; label: string; value: string; highlight?: boolean;
}) {
  return (
    <div style={{
      border: "1px solid rgba(139,105,20,0.15)",
      borderRadius: "6px",
      padding: "8px 6px",
      textAlign: "center",
      background: "rgba(139,105,20,0.04)",
    }}>
      <div style={{ fontSize: "0.75rem", marginBottom: "2px" }}>{icon}</div>
      <p style={{ fontFamily: "var(--font-display)", fontSize: "0.45rem", color: "var(--ink-light)", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, marginBottom: "2px" }}>
        {label}
      </p>
      <p style={{
        fontFamily: "var(--font-ui)",
        fontSize: "0.8rem",
        fontWeight: 700,
        color: highlight ? "var(--gold-dark)" : "var(--ink-dark)",
      }}>
        {value}
      </p>
    </div>
  );
}
