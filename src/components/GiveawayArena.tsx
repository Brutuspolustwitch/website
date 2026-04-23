"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import GiveawaySpin from "@/components/GiveawaySpin";

/* ── Types ──────────────────────────────────────────────────── */
interface Giveaway {
  id: string;
  title: string;
  description: string;
  mode: "single" | "tickets";
  ticket_cost: number;
  max_entries_per_user: number | null;
  prize: string;
  prize_image: string | null;
  duration_seconds: number;
  start_time: string | null;
  end_time: string | null;
  is_active: boolean;
  is_ended: boolean;
  chat_command: string;
  created_at: string;
}

interface Participant {
  id: string;
  twitch_id: string;
  twitch_username: string;
  tickets: number;
}

interface Winner {
  twitch_id: string;
  twitch_username: string;
  selected_at: string;
}

/* ── Sound helper ───────────────────────────────────────────── */
function playCoinSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
    if (navigator.vibrate) navigator.vibrate(50);
  } catch { /* noop */ }
}

/* ── Countdown Hook ─────────────────────────────────────────── */
function useCountdown(endTime: string | null) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!endTime) { setRemaining(0); return; }
    const update = () => {
      const diff = Math.max(0, Math.floor((new Date(endTime).getTime() - Date.now()) / 1000));
      setRemaining(diff);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  return { remaining, display: `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}` };
}

/* ── Main Component ─────────────────────────────────────────── */
export default function GiveawayArena() {
  const { user, login } = useAuth();
  const [giveaway, setGiveaway] = useState<Giveaway | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [myTickets, setMyTickets] = useState(0);
  const [ticketInput, setTicketInput] = useState(1);
  const [entering, setEntering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entryPulse, setEntryPulse] = useState(false);
  const [celebrationWinner, setCelebrationWinner] = useState<Winner | null>(null);
  const [pastGiveaways, setPastGiveaways] = useState<Giveaway[]>([]);
  const [tab, setTab] = useState<"active" | "archive">("active");
  const prevParticipantCount = useRef(0);

  /* ── Load active giveaway ─────────────────────────────────── */
  const loadActive = useCallback(async () => {
    const res = await fetch("/api/giveaways?active=true");
    const data = await res.json();
    const active = (data.giveaways ?? [])[0] || null;

    if (active) {
      setGiveaway(active);
      // Load detail
      const detailRes = await fetch(`/api/giveaways?id=${active.id}`);
      const detailData = await detailRes.json();
      setParticipants(detailData.participants ?? []);
      setWinners(detailData.winners ?? []);
    } else {
      setGiveaway(null);
      setParticipants([]);
      setWinners([]);
    }
  }, []);

  const loadPast = useCallback(async () => {
    const res = await fetch("/api/giveaways");
    const data = await res.json();
    setPastGiveaways((data.giveaways ?? []).filter((g: Giveaway) => g.is_ended));
  }, []);

  useEffect(() => {
    loadActive();
    loadPast();
  }, [loadActive, loadPast]);

  // Update my tickets
  useEffect(() => {
    if (!user || !giveaway) { setMyTickets(0); return; }
    const mine = participants.find((p) => p.twitch_id === user.id);
    setMyTickets(mine?.tickets ?? 0);
  }, [participants, user, giveaway]);

  /* ── Realtime ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!giveaway) return;

    const channel = supabase
      .channel(`giveaway-user-${giveaway.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "giveaway_participants", filter: `giveaway_id=eq.${giveaway.id}` },
        () => loadActive()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "giveaways", filter: `id=eq.${giveaway.id}` },
        (payload) => {
          const updated = payload.new as Giveaway;
          setGiveaway(updated);

          // If giveaway just ended, check for winner
          if (updated.is_ended) {
            loadActive();
            loadPast();
            // Fetch winner
            fetch(`/api/giveaways?id=${updated.id}`)
              .then((r) => r.json())
              .then((d) => {
                const w = (d.winners ?? [])[0];
                if (w) setCelebrationWinner(w);
              });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [giveaway?.id, loadActive, loadPast]);

  // Detect new participants for pulse effect
  useEffect(() => {
    if (participants.length > prevParticipantCount.current && prevParticipantCount.current > 0) {
      setEntryPulse(true);
      setTimeout(() => setEntryPulse(false), 600);
    }
    prevParticipantCount.current = participants.length;
  }, [participants.length]);

  /* ── Enter giveaway ───────────────────────────────────────── */
  const handleEnter = async () => {
    if (!user) { login(); return; }
    if (!giveaway) return;

    setEntering(true);
    setError(null);

    const res = await fetch("/api/giveaways/enter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        giveaway_id: giveaway.id,
        ticket_count: giveaway.mode === "tickets" ? ticketInput : 1,
      }),
    });

    const data = await res.json();
    setEntering(false);

    if (data.success) {
      playCoinSound();
      setMyTickets(data.tickets);
      setEntryPulse(true);
      setTimeout(() => setEntryPulse(false), 600);
      loadActive();
    } else {
      setError(data.error);
    }
  };

  const { remaining, display } = useCountdown(giveaway?.is_active ? giveaway?.end_time : null);
  const totalTickets = participants.reduce((s, p) => s + p.tickets, 0);
  const myChance = totalTickets > 0 && myTickets > 0 ? ((myTickets / totalTickets) * 100).toFixed(1) : null;

  return (
    <div className="space-y-6">
      {/* Tab switcher */}
      <div className="flex gap-2">
        {(["active", "archive"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={tab === t ? "cta-button" : "cta-button-inactive"}
            style={{ width: "auto", padding: "0 1.5em" }}
          >
            {t === "active" ? "⚔ Arena Ativa" : "📜 Arquivo"}
          </button>
        ))}
      </div>

      {tab === "active" ? (
        giveaway ? (
          <div className="space-y-4">
            {/* Main Card — papyrus scroll */}
            <motion.div
              className="papyrus-scroll papyrus-scroll-top papyrus-scroll-bottom greek-key-border"
              style={{ maxWidth: "100%" }}
              animate={entryPulse ? { boxShadow: ["0 0 0 0 rgba(180,130,20,0)", "0 0 24px 8px rgba(180,130,20,0.35)", "0 0 0 0 rgba(180,130,20,0)"] } : {}}
              transition={{ duration: 0.6 }}
            >
              <div className="relative p-5 sm:p-7">
                {/* Status + Title */}
                <div className="mb-5">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    {giveaway.is_active && (
                      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border"
                        style={{ background: "rgba(34,197,94,0.12)", borderColor: "rgba(34,197,94,0.3)", color: "#15803d" }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse" />
                        ATIVO
                      </span>
                    )}
                    <span className="text-xs px-2 py-0.5 rounded border"
                      style={{ borderColor: "var(--gold-dark)", color: "var(--ink-mid)", background: "rgba(180,130,20,0.08)" }}>
                      {giveaway.mode === "single" ? "Entrada Única" : "Sistema de Tickets"}
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-display)] tracking-wide"
                    style={{ color: "var(--ink-dark)" }}>
                    {giveaway.title}
                  </h2>
                  {giveaway.description && (
                    <p className="text-sm mt-1" style={{ color: "var(--ink-mid)" }}>{giveaway.description}</p>
                  )}
                  {giveaway.prize && (
                    <div className="mt-3 inline-block px-4 py-1.5 rounded"
                      style={{ background: "rgba(180,130,20,0.12)", border: "1px solid var(--gold-dark)", color: "var(--ink-dark)" }}>
                      <span className="text-xs uppercase tracking-wider font-[family-name:var(--font-display)]" style={{ color: "var(--ink-mid)" }}>Prémio — </span>
                      <span className="font-bold font-[family-name:var(--font-display)]">{giveaway.prize}</span>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="h-px my-4" style={{ background: "linear-gradient(90deg, transparent, var(--gold-dark), transparent)" }} />

                {/* Timer */}
                {giveaway.is_active && giveaway.end_time && (
                  <div className="text-center mb-6">
                    <p className="text-xs uppercase tracking-widest font-[family-name:var(--font-display)] mb-1"
                      style={{ color: "var(--ink-mid)" }}>Tempo Restante</p>
                    <motion.p
                      className="text-5xl sm:text-6xl font-bold font-[family-name:var(--font-display)] tracking-[0.15em]"
                      style={{ color: remaining <= 30 ? "#8b1a1a" : "var(--gold-dark)" }}
                      animate={remaining <= 10 && remaining > 0 ? { scale: [1, 1.05, 1] } : {}}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      {display}
                    </motion.p>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
                  {[
                    { label: "Participantes", val: participants.length },
                    { label: "Total Tickets", val: totalTickets },
                    { label: "Os Teus Tickets", val: myTickets },
                    { label: "Hipótese", val: myChance ? `${myChance}%` : "—" },
                  ].map(({ label, val }) => (
                    <div key={label} className="rounded p-3 text-center"
                      style={{ background: "rgba(180,130,20,0.08)", border: "1px solid rgba(180,130,20,0.25)" }}>
                      <p className="text-xs uppercase tracking-wider font-[family-name:var(--font-display)]"
                        style={{ color: "var(--ink-mid)" }}>{label}</p>
                      <p className="text-xl font-bold font-[family-name:var(--font-display)]"
                        style={{ color: "var(--ink-dark)" }}>{val}</p>
                    </div>
                  ))}
                </div>

                {/* Entry section */}
                {giveaway.is_active && (
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    {giveaway.mode === "tickets" && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setTicketInput(Math.max(1, ticketInput - 1))}
                          className="w-9 h-9 rounded font-bold text-lg transition-all"
                          style={{ background: "rgba(180,130,20,0.15)", color: "var(--ink-dark)", border: "1px solid var(--gold-dark)" }}
                        >−</button>
                        <input
                          type="number"
                          min={1}
                          max={giveaway.max_entries_per_user ? giveaway.max_entries_per_user - myTickets : 100}
                          value={ticketInput}
                          onChange={(e) => setTicketInput(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-14 h-9 rounded text-center font-bold text-lg focus:outline-none"
                          style={{ background: "rgba(180,130,20,0.08)", border: "1px solid var(--gold-dark)", color: "var(--ink-dark)" }}
                        />
                        <button
                          onClick={() => setTicketInput(ticketInput + 1)}
                          className="w-9 h-9 rounded font-bold text-lg transition-all"
                          style={{ background: "rgba(180,130,20,0.15)", color: "var(--ink-dark)", border: "1px solid var(--gold-dark)" }}
                        >＋</button>
                      </div>
                    )}

                    <button
                      onClick={handleEnter}
                      disabled={entering || (giveaway.mode === "single" && myTickets > 0)}
                      className="flex-1 sm:flex-none px-8 py-3 rounded font-bold text-lg font-[family-name:var(--font-display)] tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: "var(--ink-dark)", color: "var(--parchment-light)", border: "2px solid var(--gold-dark)" }}
                    >
                      {entering ? (
                        <span className="flex items-center gap-2 justify-center">
                          <span className="w-4 h-4 border-2 border-parchment/30 border-t-parchment rounded-full animate-spin" />
                          A entrar...
                        </span>
                      ) : giveaway.mode === "single" && myTickets > 0 ? (
                        "✓ Já Inscrito"
                      ) : (
                        <>⚔ {!user ? "Iniciar Sessão" : "Entrar na Arena"}</>
                      )}
                    </button>

                    {giveaway.ticket_cost > 0 && (
                      <p className="text-xs" style={{ color: "var(--ink-mid)" }}>
                        Custo: {giveaway.ticket_cost * (giveaway.mode === "tickets" ? ticketInput : 1)} SE Points
                      </p>
                    )}
                  </div>
                )}

                {/* Ended state with winner */}
                {giveaway.is_ended && winners.length > 0 && (
                  <div className="text-center py-4">
                    <p className="text-xs uppercase tracking-wider mb-2 font-[family-name:var(--font-display)]"
                      style={{ color: "var(--ink-mid)" }}>Vencedor</p>
                    <p className="text-3xl font-bold font-[family-name:var(--font-display)]"
                      style={{ color: "var(--ink-dark)" }}>
                      🏆 {winners[0].twitch_username}
                    </p>
                  </div>
                )}

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-4 p-3 rounded border text-sm text-center"
                      style={{ background: "rgba(139,26,26,0.08)", borderColor: "rgba(139,26,26,0.3)", color: "#8b1a1a" }}
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Top Participants leaderboard */}
            {participants.length > 0 && (
              <div className="papyrus-scroll papyrus-scroll-top papyrus-scroll-bottom" style={{ maxWidth: "100%", padding: "1.25rem 1.5rem" }}>
                <h3 className="text-sm font-bold uppercase tracking-wider mb-4 font-[family-name:var(--font-display)]"
                  style={{ color: "var(--ink-mid)" }}>
                  ⚔ Gladiadores na Arena
                </h3>
                <div className="space-y-1">
                  {participants
                    .sort((a, b) => b.tickets - a.tickets)
                    .slice(0, 20)
                    .map((p, i) => {
                      const chance = totalTickets > 0 ? ((p.tickets / totalTickets) * 100).toFixed(1) : "0";
                      const isMe = user && p.twitch_id === user.id;
                      return (
                        <div
                          key={p.id}
                          className="flex items-center justify-between py-2 px-3 rounded transition-colors"
                          style={{
                            background: isMe ? "rgba(180,130,20,0.12)" : undefined,
                            border: isMe ? "1px solid rgba(180,130,20,0.3)" : "1px solid transparent",
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-sm w-6 text-right font-bold"
                              style={{ color: i < 3 ? "var(--gold-dark)" : "var(--stone-mid)" }}>
                              {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
                            </span>
                            <span className="text-sm"
                              style={{ color: isMe ? "var(--ink-dark)" : "var(--ink-mid)", fontWeight: isMe ? 700 : 400 }}>
                              {p.twitch_username} {isMe && "(tu)"}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs">
                            <span style={{ color: "var(--ink-mid)" }}>{p.tickets} ticket{p.tickets > 1 ? "s" : ""}</span>
                            <span className="w-12 text-right font-bold" style={{ color: "var(--gold-dark)" }}>{chance}%</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* No active giveaway */
          <div className="papyrus-scroll papyrus-scroll-top papyrus-scroll-bottom" style={{ maxWidth: "100%", padding: "4rem 2rem" }}>
            <div className="flex flex-col items-center justify-center text-center">
              <div className="text-5xl mb-5">⚔️</div>
              <h2 className="text-2xl font-bold font-[family-name:var(--font-display)] tracking-wider mb-3"
                style={{ color: "var(--ink-dark)" }}>
                A Arena Está em Repouso
              </h2>
              <p className="text-sm max-w-md" style={{ color: "var(--ink-mid)" }}>
                Não há giveaways ativos de momento. Fica atento ao stream para o próximo confronto!
              </p>
            </div>
          </div>
        )
      ) : (
        /* Archive tab */
        <div className="papyrus-scroll papyrus-scroll-top papyrus-scroll-bottom" style={{ padding: "1.5rem" }}>
          {pastGiveaways.length === 0 ? (
            <p className="text-sm text-center py-12" style={{ color: "var(--ink-mid)" }}>Nenhum giveaway passado.</p>
          ) : (
            <div className="space-y-3">
              {pastGiveaways.map((g) => (
                <PastGiveawayCard key={g.id} giveaway={g} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Spin Roulette + Celebration */}
      <GiveawaySpin
        winner={celebrationWinner}
        participants={participants}
        prize={giveaway?.prize}
        onDismiss={() => setCelebrationWinner(null)}
      />
    </div>
  );
}

/* ── Past Giveaway Card ──────────────────────────────────────── */
function PastGiveawayCard({ giveaway }: { giveaway: Giveaway }) {
  const [winner, setWinner] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!expanded) return;
    fetch(`/api/giveaways?id=${giveaway.id}`)
      .then((r) => r.json())
      .then((d) => {
        const w = (d.winners ?? [])[0];
        if (w) setWinner(w.twitch_username);
      });
  }, [expanded, giveaway.id]);

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className="w-full text-left rounded p-4 transition-all"
      style={{
        background: "var(--parchment-light)",
        border: "1px solid rgba(180,130,20,0.35)",
        boxShadow: "0 2px 8px rgba(100,70,10,0.1)",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--parchment-mid)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--parchment-light)"; }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-bold font-[family-name:var(--font-display)] tracking-wide" style={{ color: "var(--ink-dark)" }}>
            {giveaway.title}
          </h4>
          <div className="flex gap-2 text-xs mt-1" style={{ color: "var(--stone-mid)" }}>
            <span>{new Date(giveaway.created_at).toLocaleDateString("pt-PT")}</span>
            <span>·</span>
            <span style={{ color: "var(--gold-dark)" }}>{giveaway.prize || "—"}</span>
          </div>
        </div>
        <svg className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}
          style={{ color: "var(--stone-mid)" }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {expanded && winner && (
        <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(180,130,20,0.25)" }}>
          <p className="text-sm" style={{ color: "var(--ink-mid)" }}>
            Vencedor: <span className="font-bold" style={{ color: "var(--gold-dark)" }}>{winner}</span>
          </p>
        </div>
      )}
    </button>
  );
}


