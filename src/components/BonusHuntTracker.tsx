"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArenaCard } from "@/components/ui/ArenaCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { STAGGER_CONTAINER, STAGGER_ITEM } from "@/lib/animations";
import { supabase } from "@/lib/supabase";
import type { BonusHuntSession, BonusHuntSlot } from "@/lib/supabase";

export function BonusHuntTracker() {
  const [sessions, setSessions] = useState<BonusHuntSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<BonusHuntSession | null>(null);
  const [slots, setSlots] = useState<BonusHuntSlot[]>([]);
  const [loading, setLoading] = useState(true);

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
      }
      setLoading(false);
    }
    load();
  }, []);

  /* Load slots when session changes */
  useEffect(() => {
    if (!selectedSession) return;

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
  const totalBuy = slots.reduce((sum, s) => sum + s.buy_value, 0);
  const totalResult = slots.filter((s) => s.opened && s.payout).reduce((sum, s) => sum + (s.payout ?? 0), 0);
  const profit = selectedSession?.profit ?? totalResult - totalBuy;

  const statusColor = {
    pending: "text-arena-smoke",
    active: "text-green-400",
    completed: "text-arena-gold",
  };

  const statusLabel = {
    pending: "Awaiting",
    active: "⚔️ IN BATTLE",
    completed: "✓ Conquered",
  };

  if (loading) {
    return (
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-arena-dark/50">
        <div className="max-w-7xl mx-auto text-center">
          <SectionHeading title="Bonus Hunt" subtitle="A carregar..." />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-arena-charcoal/40 border border-arena-steel/10 p-5 animate-pulse">
                <div className="h-4 w-20 bg-white/[0.06] rounded mb-3" />
                <div className="h-5 w-3/4 bg-white/[0.06] rounded mb-4" />
                <div className="space-y-2">
                  <div className="h-3 w-full bg-white/[0.04] rounded" />
                  <div className="h-3 w-full bg-white/[0.04] rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (sessions.length === 0) {
    return (
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-arena-dark/50">
        <div className="max-w-7xl mx-auto text-center">
          <SectionHeading title="Bonus Hunt" subtitle="Sem bonus hunts registados" />
          <p className="text-arena-smoke/40 mt-4">Os bonus hunts importados aparecerão aqui.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="bonus-hunt" className="relative py-20 px-4 sm:px-6 lg:px-8 bg-arena-dark/50 overflow-hidden">
      {/* Background texture */}
      <div
        className="absolute inset-0 opacity-[0.06] bg-cover bg-right-bottom pointer-events-none"
        style={{ backgroundImage: "url('/images/pages/warrior-illustration.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-arena-dark via-arena-dark/85 to-arena-dark/70 pointer-events-none" />
      <div className="relative max-w-7xl mx-auto">
        <ScrollReveal>
          <SectionHeading
            title="Bonus Hunt"
            subtitle={selectedSession?.title || "Acompanha cada bónus em tempo real"}
          />
        </ScrollReveal>

        {/* Session selector */}
        {sessions.length > 1 && (
          <ScrollReveal delay={0.05}>
            <div className="flex flex-wrap gap-2 mb-8 justify-center">
              {sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSession(s)}
                  className={`px-4 py-2 rounded-lg text-xs font-[family-name:var(--font-display)] tracking-wide uppercase transition-all cursor-pointer
                    ${selectedSession?.id === s.id
                      ? "bg-arena-gold/20 border border-arena-gold/40 text-arena-gold"
                      : "bg-white/[0.03] border border-arena-steel/20 text-arena-smoke/60 hover:border-arena-steel/40 hover:text-arena-smoke"
                    }`}
                >
                  {s.title}
                  {s.hunt_date && <span className="ml-2 text-[10px] opacity-60">{s.hunt_date}</span>}
                </button>
              ))}
            </div>
          </ScrollReveal>
        )}

        {/* Stats bar */}
        <ScrollReveal delay={0.1}>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 mb-10">
            {[
              { label: "Slots", value: String(selectedSession?.bonus_count || slots.length) },
              { label: "Total Buy", value: `${currency}${totalBuy.toFixed(2)}` },
              { label: "Total Win", value: `${currency}${(selectedSession?.total_result ?? totalResult).toFixed(2)}` },
              {
                label: "Profit",
                value: `${profit >= 0 ? "+" : ""}${currency}${profit.toFixed(2)}`,
                color: profit >= 0 ? "text-green-400" : "text-arena-red",
              },
              { label: "Avg Multi", value: `${(selectedSession?.avg_multi ?? 0).toFixed(1)}x` },
              { label: "Best Multi", value: `${(selectedSession?.best_multi ?? 0).toFixed(1)}x`, color: "text-arena-gold" },
            ].map((stat) => (
              <ArenaCard key={stat.label} className="p-4 text-center">
                <p className="gladiator-label text-xs text-arena-ash">
                  {stat.label}
                </p>
                <p className={`text-xl font-bold mt-1 ${stat.color ?? "text-arena-white"}`}>
                  {stat.value}
                </p>
              </ArenaCard>
            ))}
          </div>
        </ScrollReveal>

        {/* Best slot highlight */}
        {selectedSession?.best_slot_name && (
          <ScrollReveal delay={0.15}>
            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-arena-gold/10 border border-arena-gold/20 text-sm">
                <span className="text-arena-gold">🏆</span>
                <span className="text-arena-smoke/60">Melhor slot:</span>
                <span className="text-arena-gold font-bold font-[family-name:var(--font-display)]">{selectedSession.best_slot_name}</span>
                <span className="text-arena-smoke/40">({selectedSession.best_multi.toFixed(1)}x)</span>
              </span>
            </div>
          </ScrollReveal>
        )}

        {/* Card grid */}
        <motion.div
          variants={STAGGER_CONTAINER}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          style={{ perspective: "1200px" }}
        >
          <AnimatePresence mode="popLayout">
            {slots.map((slot, i) => {
              const multi = slot.bet_size && slot.bet_size > 0 && slot.payout
                ? (slot.payout / slot.bet_size).toFixed(1)
                : null;

              return (
                <motion.div
                  key={slot.id}
                  variants={STAGGER_ITEM}
                  layout
                  exit={{ opacity: 0, y: 60, scale: 0.9 }}
                  style={{ transformStyle: "preserve-3d" }}
                  whileHover={{
                    rotateX: -3,
                    rotateY: 2,
                    scale: 1.03,
                    transition: { type: "spring", stiffness: 200, damping: 15 },
                  }}
                >
                  <ArenaCard
                    variant={slot.status === "active" ? "crimson" : "default"}
                    className={`p-5 ${slot.status === "active" ? "metal-frame-glow" : ""}`}
                  >
                    {/* Thumbnail */}
                    {slot.thumbnail_url && (
                      <div className="relative aspect-[16/9] w-full rounded-lg overflow-hidden mb-3">
                        <img src={slot.thumbnail_url} alt={slot.name} className="h-full w-full object-cover" loading="lazy" />
                        {(slot.is_super_bonus || slot.is_extreme_bonus) && (
                          <div className="absolute top-2 right-2 flex gap-1">
                            {slot.is_extreme_bonus && (
                              <span className="px-1.5 py-0.5 text-[9px] rounded bg-red-500/80 text-white font-bold">EXTREME</span>
                            )}
                            {slot.is_super_bonus && (
                              <span className="px-1.5 py-0.5 text-[9px] rounded bg-arena-gold/80 text-arena-dark font-bold">SUPER</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Slot header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="gladiator-label text-xs text-arena-ash">
                          #{i + 1}
                          {slot.provider && <span className="ml-2 text-arena-smoke/40">{slot.provider}</span>}
                        </span>
                        <h3 className="gladiator-title text-lg mt-1">
                          {slot.name}
                        </h3>
                      </div>
                      <span className={`text-xs font-bold tracking-wider uppercase ${statusColor[slot.status]}`}>
                        {statusLabel[slot.status]}
                      </span>
                    </div>

                    {/* Slot stats */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-arena-ash">Bet</span>
                        <span className="text-arena-white font-bold">{currency}{(slot.bet_size ?? slot.buy_value).toFixed(2)}</span>
                      </div>
                      {slot.rtp && (
                        <div className="flex justify-between">
                          <span className="text-arena-ash">RTP</span>
                          <span className="text-arena-smoke">{slot.rtp}%</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-arena-ash">Max Win</span>
                        <span className="text-arena-gold font-bold">
                          {slot.potential_multiplier.toLocaleString("en-US")}x
                        </span>
                      </div>
                      {slot.opened && slot.payout !== undefined && slot.payout !== null && (
                        <div className="flex justify-between pt-2 border-t border-arena-steel/20">
                          <span className="text-arena-ash">Payout</span>
                          <span className="flex items-center gap-2">
                            <span
                              className={`font-bold ${
                                slot.payout >= (slot.bet_size ?? slot.buy_value) ? "text-green-400" : "text-arena-red"
                              }`}
                            >
                              {currency}{slot.payout.toFixed(2)}
                            </span>
                            {multi && <span className="text-arena-smoke/40 text-xs">({multi}x)</span>}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Active indicator bar */}
                    {slot.status === "active" && (
                      <motion.div
                        className="mt-4 h-1 progress-gold-fill"
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                      />
                    )}
                  </ArenaCard>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
