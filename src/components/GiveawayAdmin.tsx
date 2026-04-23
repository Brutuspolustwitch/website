"use client";

import { useAuth } from "@/lib/auth-context";
import { hasRole } from "@/lib/roles";
import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { TWITCH_CHANNEL } from "@/lib/constants";
import { useTwitchChatListener } from "@/hooks/useTwitchChatListener";

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
  require_live: boolean;
  created_at: string;
  participant_count?: number;
  total_tickets?: number;
}

interface Participant {
  id: string;
  giveaway_id: string;
  twitch_id: string;
  twitch_username: string;
  tickets: number;
  total_points_spent: number;
  created_at: string;
}

interface Winner {
  id: string;
  giveaway_id: string;
  twitch_id: string;
  twitch_username: string;
  selected_at: string;
}

/* ── Countdown Hook ─────────────────────────────────────────── */
function useCountdown(endTime: string | null) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!endTime) {
      setRemaining(0);
      return;
    }
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

/* ── Admin Panel ────────────────────────────────────────────── */
export default function GiveawayAdmin() {
  const { user, loading: authLoading } = useAuth();
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // Form state for creating
  const [form, setForm] = useState({
    title: "",
    description: "",
    mode: "single" as "single" | "tickets",
    ticket_cost: 0,
    max_entries_per_user: "",
    prize: "",
    prize_image: "",
    scheduled_end: "",
    chat_command: "!enter",
    require_live: true,
  });

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Selected giveaway
  const selected = giveaways.find((g) => g.id === selectedId) ?? null;

  // Chat listener
  const { status: chatStatus, recentEntries } = useTwitchChatListener({
    channel: TWITCH_CHANNEL,
    enabled: !!selected?.is_active,
    chatCommand: selected?.chat_command ?? "!enter",
    onEntry: () => {
      if (selectedId) loadGiveawayDetail(selectedId);
    },
  });

  /* ── Fetch giveaways ─────────────────────────────────────── */
  const loadGiveaways = useCallback(async () => {
    const res = await fetch("/api/giveaways");
    const data = await res.json();
    setGiveaways(data.giveaways ?? []);
    setLoading(false);
  }, []);

  const loadGiveawayDetail = useCallback(async (id: string) => {
    const res = await fetch(`/api/giveaways?id=${id}`);
    const data = await res.json();
    if (data.giveaway) {
      setGiveaways((prev) => prev.map((g) => (g.id === id ? { ...g, ...data.giveaway } : g)));
    }
    setParticipants(data.participants ?? []);
    setWinners(data.winners ?? []);
  }, []);

  useEffect(() => {
    loadGiveaways();
  }, [loadGiveaways]);

  useEffect(() => {
    if (selectedId) loadGiveawayDetail(selectedId);
  }, [selectedId, loadGiveawayDetail]);

  /* ── Realtime subscriptions ──────────────────────────────── */
  useEffect(() => {
    if (!selectedId) return;

    const channel = supabase
      .channel(`giveaway-${selectedId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "giveaway_participants", filter: `giveaway_id=eq.${selectedId}` },
        () => loadGiveawayDetail(selectedId)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "giveaways", filter: `id=eq.${selectedId}` },
        () => loadGiveawayDetail(selectedId)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedId, loadGiveawayDetail]);

  /* ── Auto-draw when timer reaches 0 ─────────────────────── */
  const autoDrawRef = useRef(false);
  useEffect(() => {
    if (!selected?.is_active || !selected?.end_time || autoDrawRef.current) return;

    const endMs = new Date(selected.end_time).getTime();
    const nowMs = Date.now();
    const diff = endMs - nowMs;

    if (diff <= 0) {
      // Timer already expired, draw now
      autoDrawRef.current = true;
      handleDraw();
      return;
    }

    const timeout = setTimeout(() => {
      autoDrawRef.current = true;
      handleDraw();
    }, diff);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.is_active, selected?.end_time]);

  // Reset auto-draw flag when selecting different giveaway
  useEffect(() => {
    autoDrawRef.current = false;
  }, [selectedId]);

  /* ── Actions ─────────────────────────────────────────────── */
  const createGiveaway = async () => {
    setSaving(true);
    const res = await fetch("/api/giveaways", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        prize_image: form.prize_image || null,
        max_entries_per_user: form.max_entries_per_user ? parseInt(form.max_entries_per_user) : null,
        scheduled_end: form.scheduled_end || null,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.giveaway) {
      showToast("Giveaway criado ✓");
      setShowCreate(false);
      setForm({ title: "", description: "", mode: "single", ticket_cost: 0, max_entries_per_user: "", prize: "", prize_image: "", scheduled_end: "", chat_command: "!enter", require_live: true });
      loadGiveaways();
    } else {
      showToast(data.error || "Erro");
    }
  };

  const doAction = async (action: string) => {
    if (!selectedId) return;
    setSaving(true);
    const res = await fetch("/api/giveaways", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selectedId, action }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.giveaway) {
      showToast(`Giveaway ${action === "start" ? "iniciado" : action === "pause" ? "pausado" : action === "end" ? "terminado" : "reiniciado"} ✓`);
      loadGiveaways();
      loadGiveawayDetail(selectedId);
    } else {
      showToast(data.error || "Erro");
    }
  };

  const handleDraw = async () => {
    if (!selectedId) return;
    setSaving(true);
    const res = await fetch("/api/giveaways/draw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ giveaway_id: selectedId }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.winner) {
      showToast(`Vencedor: ${data.winner.twitch_username}!`);
      loadGiveaways();
      loadGiveawayDetail(selectedId);
    } else {
      showToast(data.error || "Erro ao sortear");
    }
  };

  const deleteGiveaway = async (id: string) => {
    if (!confirm("Eliminar este giveaway?")) return;
    await fetch(`/api/giveaways?id=${id}`, { method: "DELETE" });
    setSelectedId(null);
    loadGiveaways();
    showToast("Eliminado ✓");
  };

  /* ── Auth gate ──────────────────────────────────────────── */
  if (authLoading) return <div className="pt-24 pb-16 min-h-screen flex items-center justify-center"><div className="animate-pulse font-[family-name:var(--font-display)]" style={{ color: "var(--ink-mid)" }}>A carregar...</div></div>;
  if (!user || !hasRole(user.role, "moderador")) return <div className="pt-24 pb-16 min-h-screen flex items-center justify-center"><div style={{ color: "#8b1a1a" }}>Acesso negado</div></div>;

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold font-[family-name:var(--font-display)]" style={{ color: "var(--ink-dark)" }}>
              ⚔ Sala de Controlo — Giveaways
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--ink-mid)" }}>Cria, gere e sorteia vencedores na arena.</p>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-4 py-2 rounded text-sm font-[family-name:var(--font-display)] tracking-wider transition-all"
            style={{ background: "rgba(180,130,20,0.12)", color: "var(--ink-dark)", border: "1px solid var(--gold-dark)" }}
          >
            {showCreate ? "✕ Cancelar" : "＋ Novo Giveaway"}
          </button>
        </div>

        {/* Create Form */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="papyrus-scroll papyrus-scroll-top papyrus-scroll-bottom" style={{ maxWidth: "100%", padding: "1.5rem" }}>
                <h3 className="text-lg font-bold font-[family-name:var(--font-display)] mb-4" style={{ color: "var(--ink-dark)" }}>Criar Giveaway</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Título" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
                  <FormField label="Prémio" value={form.prize} onChange={(v) => setForm({ ...form, prize: v })} />
                  <FormField label="Descrição" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
                  <FormField label="Comando Chat" value={form.chat_command} onChange={(v) => setForm({ ...form, chat_command: v })} />
                  <FormField label="Imagem do Prémio (URL)" value={form.prize_image} onChange={(v) => setForm({ ...form, prize_image: v })} placeholder="https://..." />

                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-wider font-medium" style={{ color: "var(--stone-mid)" }}>Modo</label>
                    <div className="flex gap-2">
                      {(["single", "tickets"] as const).map((m) => (
                        <button
                          key={m}
                          onClick={() => setForm({ ...form, mode: m })}
                          className="flex-1 px-3 py-2 rounded text-sm transition-all font-[family-name:var(--font-display)]"
                          style={form.mode === m
                            ? { background: "var(--ink-dark)", color: "var(--parchment-light)", border: "1px solid var(--gold-dark)" }
                            : { background: "rgba(180,130,20,0.06)", color: "var(--stone-mid)", border: "1px solid rgba(180,130,20,0.2)" }}
                        >
                          {m === "single" ? "Entrada Única" : "Tickets"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {form.mode === "tickets" && (
                    <>
                      <FormField
                        label="Custo por Ticket (SE Points)"
                        type="number"
                        value={form.ticket_cost.toString()}
                        onChange={(v) => setForm({ ...form, ticket_cost: parseInt(v) || 0 })}
                      />
                      <FormField
                        label="Máx. Tickets por User (vazio = ilimitado)"
                        value={form.max_entries_per_user}
                        onChange={(v) => setForm({ ...form, max_entries_per_user: v })}
                      />
                    </>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs text-arena-smoke/70 uppercase tracking-wider font-medium">Data/Hora de Fim</label>
                    <input
                      type="datetime-local"
                      value={form.scheduled_end}
                      onChange={(e) => setForm({ ...form, scheduled_end: e.target.value })}
                      className="w-full px-3 py-2 rounded text-sm focus:outline-none transition-colors"
                    style={{ background: "rgba(245,230,200,0.6)", border: "1px solid var(--gold-dark)", color: "var(--ink-dark)", colorScheme: "light" }}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="text-xs uppercase tracking-wider font-medium" style={{ color: "var(--stone-mid)" }}>Requer Stream Live</label>
                    <button
                      onClick={() => setForm({ ...form, require_live: !form.require_live })}
                      className="w-10 h-6 rounded-full transition-all relative"
                      style={{ background: form.require_live ? "var(--gold-dark)" : "rgba(180,130,20,0.2)" }}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full shadow transition-all ${form.require_live ? "left-[18px]" : "left-0.5"}`}
                        style={{ background: form.require_live ? "var(--parchment-light)" : "rgba(245,230,200,0.7)" }} />
                    </button>
                  </div>
                </div>

                <button
                  onClick={createGiveaway}
                  disabled={saving || !form.title}
                  className="px-6 py-3 rounded font-bold font-[family-name:var(--font-display)] tracking-wider transition-all disabled:opacity-40"
                  style={{ background: "var(--ink-dark)", color: "var(--parchment-light)", border: "2px solid var(--gold-dark)" }}
                >
                  {saving ? "A criar..." : "⚔ Criar Giveaway"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Giveaway List */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-2 font-[family-name:var(--font-display)]" style={{ color: "var(--stone-mid)" }}>Giveaways</h3>
            {loading ? (
              <div className="animate-pulse" style={{ color: "var(--ink-mid)" }}>A carregar...</div>
            ) : giveaways.length === 0 ? (
              <div className="text-sm" style={{ color: "var(--stone-mid)" }}>Nenhum giveaway criado.</div>
            ) : (
              giveaways.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelectedId(g.id)}
                  className="w-full text-left rounded p-3 transition-all"
                  style={{
                    border: selectedId === g.id ? "1px solid var(--gold-dark)" : "1px solid rgba(180,130,20,0.2)",
                    background: selectedId === g.id ? "rgba(180,130,20,0.1)" : "rgba(245,230,200,0.03)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold font-[family-name:var(--font-display)] truncate" style={{ color: "var(--ink-dark)" }}>{g.title}</h4>
                    <StatusBadge isActive={g.is_active} isEnded={g.is_ended} />
                  </div>
                  <div className="flex gap-3 mt-1 text-xs" style={{ color: "var(--stone-mid)" }}>
                    <span>{g.mode === "single" ? "Entrada Única" : "Tickets"}</span>
                    <span>·</span>
                    <span>{g.participant_count ?? 0} participantes</span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Right: Selected Detail */}
          <div className="lg:col-span-2">
            {selected ? (
              <GiveawayDetail
                giveaway={selected}
                participants={participants}
                winners={winners}
                chatStatus={chatStatus}
                recentEntries={recentEntries}
                saving={saving}
                onAction={doAction}
                onDraw={handleDraw}
                onDelete={() => deleteGiveaway(selected.id)}
              />
            ) : (
              <div className="flex items-center justify-center h-64 rounded"
                style={{ border: "1px solid rgba(180,130,20,0.15)", background: "rgba(245,230,200,0.03)" }}>
                <p className="text-sm font-[family-name:var(--font-display)] tracking-wider" style={{ color: "var(--stone-mid)" }}>
                  Seleciona um giveaway para gerir
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 px-4 py-2 rounded font-medium text-sm shadow-lg animate-[fadeIn_0.2s_ease-out] font-[family-name:var(--font-display)] tracking-wider"
            style={{ background: "var(--parchment-light)", color: "var(--ink-dark)", border: "1px solid var(--gold-dark)", boxShadow: "0 4px 20px rgba(180,130,20,0.3)" }}>
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Detail Panel ────────────────────────────────────────────── */
function GiveawayDetail({
  giveaway,
  participants,
  winners,
  chatStatus,
  recentEntries,
  saving,
  onAction,
  onDraw,
  onDelete,
}: {
  giveaway: Giveaway;
  participants: Participant[];
  winners: Winner[];
  chatStatus: string;
  recentEntries: { twitch_id: string; twitch_username: string; tickets: number; timestamp: number }[];
  saving: boolean;
  onAction: (action: string) => void;
  onDraw: () => void;
  onDelete: () => void;
}) {
  const { remaining, display } = useCountdown(giveaway.is_active ? giveaway.end_time : null);
  const totalTickets = participants.reduce((s, p) => s + p.tickets, 0);

  return (
    <div className="space-y-4">
      {/* Header — papyrus card */}
      <div className="papyrus-scroll papyrus-scroll-top papyrus-scroll-bottom greek-key-border" style={{ maxWidth: "100%", padding: "1.5rem" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold font-[family-name:var(--font-display)]" style={{ color: "var(--ink-dark)" }}>{giveaway.title}</h2>
            {giveaway.description && <p className="text-sm mt-1" style={{ color: "var(--ink-mid)" }}>{giveaway.description}</p>}
          </div>
          <StatusBadge isActive={giveaway.is_active} isEnded={giveaway.is_ended} large />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
          <StatBox label="Participantes" value={participants.length.toString()} />
          <StatBox label="Total Tickets" value={totalTickets.toString()} />
          <StatBox label="Modo" value={giveaway.mode === "single" ? "Única" : "Tickets"} />
          <StatBox label="Custo" value={giveaway.ticket_cost > 0 ? `${giveaway.ticket_cost} pts` : "Grátis"} />
        </div>

        {/* Timer */}
        {giveaway.is_active && giveaway.end_time && (
          <div className="text-center mb-5">
            <p className="text-xs uppercase tracking-wider mb-1 font-[family-name:var(--font-display)]"
              style={{ color: "var(--ink-mid)" }}>Tempo Restante</p>
            <p className="text-5xl font-bold font-[family-name:var(--font-display)] tracking-wider"
              style={{ color: remaining <= 30 ? "#8b1a1a" : "var(--gold-dark)" }}>
              {display}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {!giveaway.is_ended && !giveaway.is_active && (
            <ActionButton label="▶ Iniciar" onClick={() => onAction("start")} disabled={saving} color="gold" />
          )}
          {giveaway.is_active && (
            <ActionButton label="⏸ Pausar" onClick={() => onAction("pause")} disabled={saving} color="amber" />
          )}
          {giveaway.is_active && (
            <ActionButton label="⏹ Terminar" onClick={() => onAction("end")} disabled={saving} color="red" />
          )}
          {participants.length > 0 && (
            <ActionButton label="🎲 Sortear Vencedor" onClick={onDraw} disabled={saving} color="gold" primary />
          )}
          {giveaway.is_ended && (
            <ActionButton label="↻ Reiniciar" onClick={() => onAction("reset")} disabled={saving} color="steel" />
          )}
          <ActionButton label="🗑 Eliminar" onClick={onDelete} disabled={saving} color="red" />
        </div>
      </div>

      {/* Chat Status */}
      <div className="rounded border p-4" style={{ background: "rgba(245,230,200,0.04)", borderColor: "rgba(180,130,20,0.2)" }}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold uppercase tracking-wider font-[family-name:var(--font-display)]"
            style={{ color: "var(--stone-mid)" }}>
            Twitch Chat Listener
          </h3>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              chatStatus === "connected" ? "bg-emerald-400 animate-pulse" : chatStatus === "connecting" ? "bg-yellow-400 animate-pulse" : "bg-red-400"
            }`} />
            <span className="text-xs capitalize" style={{ color: "var(--stone-mid)" }}>{chatStatus}</span>
          </div>
        </div>
        <p className="text-xs" style={{ color: "var(--stone-mid)" }}>
          Comando: <span className="font-mono" style={{ color: "var(--gold-dark)" }}>{giveaway.chat_command}</span>
          {giveaway.mode === "tickets" && (
            <> · Ex: <span className="font-mono" style={{ color: "var(--gold-dark)" }}>{giveaway.chat_command} 5</span> para 5 tickets</>
          )}
        </p>

        {recentEntries.length > 0 && (
          <div className="mt-3 max-h-32 overflow-y-auto space-y-1">
            {recentEntries.slice(0, 10).map((entry, i) => (
              <div key={`${entry.twitch_id}-${entry.timestamp}-${i}`} className="flex items-center gap-2 text-xs">
                <span style={{ color: "var(--gold-dark)" }}>⚔</span>
                <span style={{ color: "var(--ink-mid)" }}>{entry.twitch_username}</span>
                {entry.tickets > 1 && <span style={{ color: "var(--stone-mid)" }}>×{entry.tickets}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Winners */}
      {winners.length > 0 && (
        <div className="papyrus-scroll papyrus-scroll-top papyrus-scroll-bottom" style={{ maxWidth: "100%", padding: "1rem 1.5rem" }}>
          <h3 className="text-sm font-bold uppercase tracking-wider mb-3 font-[family-name:var(--font-display)]"
            style={{ color: "var(--ink-dark)" }}>🏆 Vencedores</h3>
          {winners.map((w) => (
            <div key={w.id} className="flex items-center gap-3 py-2 last:pb-0"
              style={{ borderBottom: "1px solid rgba(180,130,20,0.2)" }}>
              <span className="text-2xl">⚔️</span>
              <div>
                <p className="font-bold font-[family-name:var(--font-display)]" style={{ color: "var(--ink-dark)" }}>{w.twitch_username}</p>
                <p className="text-xs" style={{ color: "var(--ink-mid)" }}>{new Date(w.selected_at).toLocaleString("pt-PT")}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Participants */}
      <div className="rounded border p-4" style={{ background: "rgba(245,230,200,0.04)", borderColor: "rgba(180,130,20,0.2)" }}>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-3 font-[family-name:var(--font-display)]"
          style={{ color: "var(--stone-mid)" }}>
          Participantes ({participants.length})
        </h3>
        {participants.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--stone-mid)" }}>Nenhum participante ainda.</p>
        ) : (
          <div className="max-h-64 overflow-y-auto space-y-1">
            {participants.map((p, i) => {
              const chance = totalTickets > 0 ? ((p.tickets / totalTickets) * 100).toFixed(1) : "0";
              return (
                <div key={p.id} className="flex items-center justify-between py-1.5 px-2 rounded transition-colors hover:bg-[rgba(180,130,20,0.06)]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-6" style={{ color: "var(--stone-mid)" }}>{i + 1}.</span>
                    <span className="text-sm" style={{ color: "var(--ink-mid)" }}>{p.twitch_username}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs" style={{ color: "var(--stone-mid)" }}>
                    <span>{p.tickets} ticket{p.tickets > 1 ? "s" : ""}</span>
                    <span style={{ color: "var(--gold-dark)" }}>{chance}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Utility Components ──────────────────────────────────────── */
function StatusBadge({ isActive, isEnded, large }: { isActive: boolean; isEnded: boolean; large?: boolean }) {
  const cls = large ? "px-3 py-1.5 text-sm" : "px-2 py-0.5 text-xs";
  if (isActive) return <span className={`rounded-full bg-emerald-500/20 text-emerald-400 font-medium ${cls}`}>Ativo</span>;
  if (isEnded) return <span className={`rounded-full bg-red-500/20 text-red-400 font-medium ${cls}`}>Terminado</span>;
  return <span className={`rounded-full bg-yellow-500/20 text-yellow-400 font-medium ${cls}`}>Rascunho</span>;
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded p-3 text-center"
      style={{ background: "rgba(180,130,20,0.08)", border: "1px solid rgba(180,130,20,0.25)" }}>
      <p className="text-xs uppercase tracking-wider font-[family-name:var(--font-display)]"
        style={{ color: "var(--ink-mid)" }}>{label}</p>
      <p className="text-lg font-bold font-[family-name:var(--font-display)]"
        style={{ color: "var(--ink-dark)" }}>{value}</p>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  disabled,
  color,
  primary,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  color: string;
  primary?: boolean;
}) {
  const colorMap: Record<string, string> = {
    gold: primary
      ? "background:var(--ink-dark);color:var(--parchment-light);border:2px solid var(--gold-dark)"
      : "background:rgba(180,130,20,0.12);color:var(--ink-dark);border:1px solid var(--gold-dark)",
    red: "background:rgba(139,26,26,0.12);color:#8b1a1a;border:1px solid rgba(139,26,26,0.4)",
    amber: "background:rgba(180,100,0,0.12);color:var(--gold-dark);border:1px solid rgba(180,100,0,0.4)",
    steel: "background:rgba(180,130,20,0.06);color:var(--stone-mid);border:1px solid rgba(180,130,20,0.2)",
  };

  const styleStr = colorMap[color] || colorMap.steel;
  const styleObj = Object.fromEntries(
    styleStr.split(";").filter(Boolean).map((s) => {
      const [k, ...v] = s.split(":");
      return [k.trim().replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase()), v.join(":").trim()];
    })
  );

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={styleObj}
      className="px-4 py-2 rounded text-sm font-medium transition-all disabled:opacity-40 font-[family-name:var(--font-display)] tracking-wider"
    >
      {label}
    </button>
  );
}

function FormField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs uppercase tracking-wider font-medium" style={{ color: "var(--stone-mid)" }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded text-sm focus:outline-none transition-colors"
        style={{ background: "rgba(245,230,200,0.6)", border: "1px solid rgba(180,130,20,0.35)", color: "var(--ink-dark)" }}
      />
    </div>
  );
}
