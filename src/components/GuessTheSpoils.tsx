"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase, type BonusHuntSession, type BonusHuntSlot } from "@/lib/supabase";
import { ArenaCard } from "@/components/ui/ArenaCard";
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
    campaign?.status === "active" ? "IN BATTLE" :
    campaign?.status === "completed" ? "COMPLETED" : "UPCOMING";
  const statusClr =
    campaign?.status === "active" ? "text-arena-red border-arena-red/40" :
    campaign?.status === "completed" ? "text-green-400 border-green-400/40" :
    "text-arena-gold border-arena-gold/40";

  /* ── Render ──────────────────────────────────────────────────────── */

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-[1400px] mx-auto">

        {/* ── Heading ──────────────────────────────────────────────── */}
        <ScrollReveal>
          <div className="text-center mb-14">
            <h1 className="gladiator-title text-4xl sm:text-5xl lg:text-6xl">
              Guess the Spoils
            </h1>
            <p className="gladiator-subtitle mt-3 text-xs sm:text-sm">
              Survive the Arena and Claim Your Glory!
            </p>
          </div>
        </ScrollReveal>

        {/* ── Loading / Empty ──────────────────────────────────────── */}
        {loading ? (
          <div className="text-center text-arena-smoke py-24 text-sm">A carregar campanhas…</div>
        ) : !campaign ? (
          <div className="text-center text-arena-smoke py-24">
            <p className="text-lg">Nenhuma campanha ativa.</p>
            <p className="text-sm mt-2 text-arena-ash">As campanhas aparecem aqui durante os Bonus Hunts.</p>
          </div>
        ) : (

        /* ── Main Grid ─────────────────────────────────────────────── */
        <ScrollReveal delay={0.1}>
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">

            {/* ▸ LEFT — Campaign Table ─────────────────────────────── */}
            <ArenaCard className="p-0 overflow-hidden">

              {/* Campaign header bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded bg-arena-crimson/20 border border-arena-crimson/30 flex items-center justify-center text-arena-gold text-base">
                    🛡
                  </div>
                  <h2 className="gladiator-label text-lg text-arena-white font-bold">
                    Campaign {toRoman(idx + 1)}
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  {/* Nav arrows */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => setIdx((p) => Math.max(0, p - 1))}
                      disabled={idx === 0}
                      className="w-8 h-8 flex items-center justify-center border border-white/10 text-arena-smoke hover:text-arena-white hover:border-white/25 disabled:opacity-25 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                      ‹
                    </button>
                    <button
                      onClick={() => setIdx((p) => Math.min(campaigns.length - 1, p + 1))}
                      disabled={idx === campaigns.length - 1}
                      className="w-8 h-8 flex items-center justify-center border border-white/10 text-arena-smoke hover:text-arena-white hover:border-white/25 disabled:opacity-25 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                      ›
                    </button>
                  </div>

                  {/* Status badge */}
                  <span className={`px-3 py-1 text-[10px] font-bold tracking-widest uppercase border ${statusClr}`}>
                    {statusLabel}
                  </span>

                  <span className="text-arena-smoke text-sm whitespace-nowrap">
                    {victories} / {total} Victories
                  </span>
                </div>
              </div>

              {/* Table header */}
              <div className="hidden sm:grid grid-cols-[44px_1fr_72px_72px_130px_100px] px-5 py-2.5 text-[10px] text-arena-ash font-bold tracking-widest uppercase border-b border-white/5">
                <span>#</span>
                <span>Slot (Battle)</span>
                <span>Betsize</span>
                <span>Votes</span>
                <span>Special</span>
                <span className="text-right">Winnings</span>
              </div>

              {/* Slot rows */}
              <div className="divide-y divide-white/[0.04]">
                {slots.map((slot, i) => (
                  <motion.div
                    key={slot.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="grid grid-cols-[44px_1fr_72px_72px_130px_100px] px-5 py-3.5 items-center hover:bg-white/[0.02] transition-colors"
                  >
                    {/* # */}
                    <span className="text-arena-ash text-sm">#{i + 1}</span>

                    {/* Slot info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded shrink-0 overflow-hidden bg-arena-iron">
                        {slot.thumbnail_url ? (
                          <img src={slot.thumbnail_url} alt={slot.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-arena-steel to-arena-charcoal flex items-center justify-center text-arena-ash text-[10px]">⚔</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-arena-white font-semibold text-sm truncate">{slot.name}</p>
                        {slot.provider && (
                          <p className="text-arena-ash text-[10px] uppercase tracking-widest">{slot.provider}</p>
                        )}
                      </div>
                    </div>

                    {/* Betsize */}
                    <span className="text-arena-white text-sm">{slot.buy_value.toFixed(2)}€</span>

                    {/* Votes */}
                    <div className="flex gap-1.5">
                      <span className="w-7 h-7 flex items-center justify-center border border-white/10 text-arena-ash rounded text-[10px]">⚔</span>
                      <span className="w-7 h-7 flex items-center justify-center border border-white/10 text-arena-ash rounded text-[10px]">⚙</span>
                    </div>

                    {/* Special */}
                    <div>
                      {slot.special ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase rounded border text-arena-red border-arena-red/40 bg-arena-red/10">
                          {slot.special.toLowerCase().includes("death") ? "💀" : "👑"} {slot.special}
                        </span>
                      ) : null}
                    </div>

                    {/* Winnings */}
                    <span className="text-right text-arena-white font-semibold text-sm">
                      {slot.result != null ? `${slot.result.toFixed(2)}€` : "—"}
                    </span>
                  </motion.div>
                ))}

                {slots.length === 0 && (
                  <div className="px-5 py-16 text-center text-arena-ash text-sm">
                    Nenhum slot nesta campanha.
                  </div>
                )}
              </div>
            </ArenaCard>

            {/* ▸ RIGHT — War Stats ─────────────────────────────────── */}
            <ArenaCard className="p-0 overflow-hidden self-start">

              {/* Tabs */}
              <div className="flex border-b border-white/5">
                {([
                  { id: "war-stats", label: "War Stats", icon: "📊" },
                  { id: "treasury", label: "Treasury", icon: "🔗" },
                  { id: "favor", label: "Favor", icon: "⭐" },
                  { id: "records", label: "Records", icon: "🕐" },
                ] as { id: StatsTab; label: string; icon: string }[]).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] uppercase tracking-widest transition-colors relative ${
                      tab === t.id ? "text-arena-white" : "text-arena-ash hover:text-arena-smoke"
                    }`}
                  >
                    <span className="text-sm">{t.icon}</span>
                    <span>{t.label}</span>
                    {tab === t.id && (
                      <motion.div
                        layoutId="gts-tab"
                        className="absolute bottom-0 left-2 right-2 h-0.5 bg-arena-crimson"
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="p-4">

                {/* WAR STATS ──────────────────────────────────────── */}
                {tab === "war-stats" && (
                  <div className="space-y-4">
                    {/* Start / Stop / Target */}
                    <div className="grid grid-cols-3 gap-2">
                      <StatBox icon="⚔" label="Start" value={`${campaign.start_amount.toFixed(2)}€`} />
                      <StatBox icon="⭕" label="Stop" value={`${campaign.stop_amount.toFixed(2)}€`} />
                      <StatBox icon="🎯" label="Target" value={`${campaign.target_amount.toFixed(2)}€`} valueColor="text-arena-red" iconColor="text-green-500" />
                    </div>

                    {/* Campaign progress */}
                    <div className="bg-arena-black/50 border border-white/5 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-arena-ash text-[10px] uppercase tracking-widest font-bold">Campaign Progress</span>
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-bold rounded">
                          {victories}/{total}
                        </span>
                      </div>
                      <div className="h-2 bg-arena-iron rounded-full overflow-hidden">
                        <motion.div
                          className="h-full progress-gold-fill rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 1, delay: 0.3 }}
                        />
                      </div>
                    </div>

                    {/* Current BE */}
                    <div className="flex items-center justify-between py-2.5 px-1">
                      <span className="flex items-center gap-2 text-arena-ash text-[10px] uppercase tracking-widest font-bold">
                        ⚡ Current BE
                      </span>
                      <span className="text-arena-white text-xl font-bold">{currentBE.toFixed(2)}x</span>
                    </div>

                    {/* Initial BE */}
                    <div className="flex items-center justify-between py-2.5 px-1 border-t border-white/5">
                      <span className="flex items-center gap-2 text-arena-ash text-[10px] uppercase tracking-widest font-bold">
                        ○ Initial BE
                      </span>
                      <span className="text-arena-white text-sm font-bold">1.00x</span>
                    </div>
                  </div>
                )}

                {/* TREASURY ───────────────────────────────────────── */}
                {tab === "treasury" && (
                  <div className="py-10 text-center space-y-3">
                    <p className="text-arena-ash text-sm">💰 Total Winnings</p>
                    <p className="gladiator-title text-3xl arena-glow">
                      {totalWin.toFixed(2)}€
                    </p>
                    <p className="text-arena-ash text-xs">Total Buy: {totalBuy.toFixed(2)}€</p>
                    <p className={`text-sm font-bold ${totalWin >= totalBuy ? "text-green-400" : "text-arena-red"}`}>
                      {totalWin >= totalBuy ? "+" : ""}{(totalWin - totalBuy).toFixed(2)}€
                    </p>
                  </div>
                )}

                {/* FAVOR ──────────────────────────────────────────── */}
                {tab === "favor" && (
                  <div className="py-10 text-center text-arena-ash text-sm">
                    Votação em breve.
                  </div>
                )}

                {/* RECORDS ────────────────────────────────────────── */}
                {tab === "records" && (
                  <div className="py-10 text-center text-arena-ash text-sm">
                    Histórico em breve.
                  </div>
                )}
              </div>
            </ArenaCard>
          </div>
        </ScrollReveal>
        )}
      </div>
    </section>
  );
}

/* ── Small stat box ─────────────────────────────────────────────────── */

function StatBox({
  icon, label, value, valueColor = "text-arena-white", iconColor = "text-arena-ash",
}: {
  icon: string; label: string; value: string; valueColor?: string; iconColor?: string;
}) {
  return (
    <div className="bg-arena-black/50 border border-white/5 rounded-lg p-3 text-center">
      <div className={`${iconColor} text-xs mb-1`}>{icon}</div>
      <p className="text-arena-ash text-[10px] uppercase tracking-widest font-bold mb-1">{label}</p>
      <p className={`${valueColor} text-sm font-bold`}>{value}</p>
    </div>
  );
}
