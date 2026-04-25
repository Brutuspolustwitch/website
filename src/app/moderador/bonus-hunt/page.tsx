"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { hasRole } from "@/lib/roles";
import {
  supabase,
  type BonusHuntSession,
  type BonusHuntSlot,
  type GuessSession,
} from "@/lib/supabase";

export default function ModeradorBonusHuntPage() {
  const { user } = useAuth();
  const allowed = hasRole(user?.role, "moderador");

  const [hunts, setHunts] = useState<BonusHuntSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [slots, setSlots] = useState<BonusHuntSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingSlot, setSavingSlot] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [guessSession, setGuessSession] = useState<GuessSession | null>(null);
  const [guessCount, setGuessCount] = useState(0);
  const [guessLoading, setGuessLoading] = useState(false);

  /* ── Load hunts ─────────────────────────────── */
  const loadHunts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("bonus_hunt_sessions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setHunts(data as BonusHuntSession[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (allowed) loadHunts();
  }, [allowed, loadHunts]);

  /* ── Load slots + guess session ─────────────── */
  const loadSlots = useCallback(async (huntId: string) => {
    setSlotsLoading(true);
    const { data } = await supabase
      .from("bonus_hunt_slots")
      .select("*")
      .eq("session_id", huntId)
      .order("order_index", { ascending: true });
    setSlots((data as BonusHuntSlot[]) ?? []);
    setDrafts({});
    setSlotsLoading(false);
  }, []);

  const loadGuess = useCallback(async (huntId: string) => {
    setGuessLoading(true);
    const res = await fetch(`/api/guess-predictions?huntSessionId=${huntId}`);
    if (res.ok) {
      const data = await res.json();
      setGuessSession(data.guessSession ?? null);
      setGuessCount(data.totalCount ?? 0);
    } else {
      setGuessSession(null);
      setGuessCount(0);
    }
    setGuessLoading(false);
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setSlots([]);
      setGuessSession(null);
      setGuessCount(0);
      return;
    }
    loadSlots(selectedId);
    loadGuess(selectedId);
  }, [selectedId, loadSlots, loadGuess]);

  /* Realtime: slot changes */
  useEffect(() => {
    if (!selectedId) return;
    const ch = supabase
      .channel(`mod-bh-slots-${selectedId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bonus_hunt_slots", filter: `session_id=eq.${selectedId}` },
        () => loadSlots(selectedId)
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [selectedId, loadSlots]);

  /* ── Save payout ───────────────────────────── */
  async function savePayout(slot: BonusHuntSlot) {
    const raw = drafts[slot.id];
    if (raw === undefined) return;
    const trimmed = raw.trim().replace(",", ".");
    const payout = trimmed === "" ? null : Number(trimmed);
    if (payout !== null && (!isFinite(payout) || payout < 0)) {
      setMsg({ ok: false, text: "Valor inválido" });
      return;
    }
    setSavingSlot(slot.id);
    setMsg(null);
    const res = await fetch(`/api/bonus-hunt/slots/${slot.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payout }),
    });
    setSavingSlot(null);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg({ ok: false, text: data.error ?? "Erro ao guardar" });
      return;
    }
    setMsg({ ok: true, text: `Payout guardado para ${slot.name}` });
    setDrafts((prev) => { const c = { ...prev }; delete c[slot.id]; return c; });
    if (selectedId) loadSlots(selectedId);
  }

  async function clearPayout(slot: BonusHuntSlot) {
    setSavingSlot(slot.id);
    setMsg(null);
    const res = await fetch(`/api/bonus-hunt/slots/${slot.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ opened: false }),
    });
    setSavingSlot(null);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg({ ok: false, text: data.error ?? "Erro" });
      return;
    }
    setMsg({ ok: true, text: `Payout removido de ${slot.name}` });
    if (selectedId) loadSlots(selectedId);
  }

  /* ── Guess session actions ────────────────── */
  async function callGuess(body: Record<string, unknown>) {
    setGuessLoading(true);
    setMsg(null);
    const res = await fetch("/api/guess-predictions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setGuessLoading(false);
    if (!res.ok) {
      setMsg({ ok: false, text: data.error ?? "Erro" });
      return;
    }
    if (data.guessSession) setGuessSession(data.guessSession);
    setMsg({ ok: true, text: "Operação concluída" });
    if (selectedId) loadGuess(selectedId);
  }

  function createGuess() {
    if (!selectedId) return;
    callGuess({ action: "create", huntSessionId: selectedId });
  }

  function toggleBetting() {
    if (!guessSession) return;
    callGuess({ action: "toggle_betting", guessSessionId: guessSession.id });
  }

  /* ── Render ───────────────────────────────── */
  if (!allowed) {
    return (
      <div className="pt-24 pb-16 max-w-4xl mx-auto px-6">
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-red-200">
          Acesso negado. Esta página é para moderadores.
        </div>
      </div>
    );
  }

  const selectedHunt = hunts.find((h) => h.id === selectedId) ?? null;

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <header className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Bonus Hunt — Moderador</h1>
            <p className="text-sm text-white/60 mt-1">
              Adiciona/edita payouts dos slots e controla a fase de apostas do Adivinha-o-Resultado.
            </p>
          </div>
          {msg && (
            <div className={`text-sm px-3 py-2 rounded-md border ${msg.ok ? "border-green-500/40 bg-green-500/10 text-green-200" : "border-red-500/40 bg-red-500/10 text-red-200"}`}>
              {msg.text}
            </div>
          )}
        </header>

        {/* Hunt picker */}
        <section className="rounded-xl border border-white/10 bg-black/30 backdrop-blur-sm p-4">
          <h2 className="text-sm uppercase tracking-wider text-white/60 mb-3">Sessões recentes</h2>
          {loading ? (
            <p className="text-white/40 text-sm">A carregar...</p>
          ) : hunts.length === 0 ? (
            <p className="text-white/40 text-sm">Nenhuma sessão encontrada.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {hunts.map((h) => (
                <button
                  key={h.id}
                  onClick={() => setSelectedId(h.id === selectedId ? null : h.id)}
                  className={`text-xs px-3 py-2 rounded-md border transition ${
                    selectedId === h.id
                      ? "border-arena-gold/60 bg-arena-gold/15 text-white"
                      : "border-white/15 bg-white/5 text-white/80 hover:border-white/30"
                  }`}
                >
                  <span className="font-semibold">{h.title}</span>
                  <span className="ml-2 text-white/40">{h.status}</span>
                </button>
              ))}
            </div>
          )}
        </section>

        {selectedHunt && (
          <>
            {/* Guess session controls */}
            <section className="rounded-xl border border-white/10 bg-black/30 backdrop-blur-sm p-5">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">Adivinha-o-Resultado</h2>
                  <p className="text-xs text-white/50 mt-1">
                    {guessSession
                      ? `Estado: ${guessSession.status} · Apostas: ${guessSession.betting_open ? "ABERTAS" : "FECHADAS"} · Palpites: ${guessCount}`
                      : "Sem sessão de apostas para esta hunt."}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!guessSession ? (
                    <button
                      onClick={createGuess}
                      disabled={guessLoading}
                      className="text-sm px-4 py-2 rounded-md border border-arena-gold/40 bg-arena-gold/15 text-white hover:bg-arena-gold/25 disabled:opacity-50"
                    >
                      Criar sessão de apostas
                    </button>
                  ) : guessSession.status === "open" ? (
                    <button
                      onClick={toggleBetting}
                      disabled={guessLoading}
                      className={`text-sm px-4 py-2 rounded-md border disabled:opacity-50 ${
                        guessSession.betting_open
                          ? "border-red-500/50 bg-red-500/15 text-red-100 hover:bg-red-500/25"
                          : "border-green-500/50 bg-green-500/15 text-green-100 hover:bg-green-500/25"
                      }`}
                    >
                      {guessSession.betting_open ? "Parar apostas" : "Começar apostas"}
                    </button>
                  ) : (
                    <span className="text-xs text-white/50 px-3 py-2 border border-white/10 rounded-md">
                      Apostas {guessSession.status === "locked" ? "bloqueadas" : "resolvidas"}
                    </span>
                  )}
                </div>
              </div>
            </section>

            {/* Slots editor */}
            <section className="rounded-xl border border-white/10 bg-black/30 backdrop-blur-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-white">Slots — payouts</h2>
                <span className="text-xs text-white/50">
                  {slots.filter((s) => s.opened).length} / {slots.length} abertos
                </span>
              </div>
              {slotsLoading ? (
                <p className="text-white/40 text-sm">A carregar slots...</p>
              ) : slots.length === 0 ? (
                <p className="text-white/40 text-sm">Sem slots nesta sessão.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-white/50 border-b border-white/10">
                        <th className="px-2 py-2 w-10">#</th>
                        <th className="px-2 py-2">Slot</th>
                        <th className="px-2 py-2 w-24">Bet</th>
                        <th className="px-2 py-2 w-32">Payout actual</th>
                        <th className="px-2 py-2 w-44">Novo payout</th>
                        <th className="px-2 py-2 w-44">Acções</th>
                      </tr>
                    </thead>
                    <tbody>
                      {slots.map((s, i) => {
                        const currentPayout = (s.payout ?? s.result ?? null) as number | null;
                        const draft = drafts[s.id];
                        const dirty = draft !== undefined && draft !== "";
                        return (
                          <tr key={s.id} className={`border-b border-white/5 ${s.opened ? "" : "opacity-90"}`}>
                            <td className="px-2 py-2 text-white/40">#{i + 1}</td>
                            <td className="px-2 py-2">
                              <div className="flex items-center gap-2">
                                {s.thumbnail_url && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={s.thumbnail_url} alt={s.name} className="w-8 h-8 rounded object-cover" />
                                )}
                                <div>
                                  <div className="text-white font-medium">{s.name}</div>
                                  {s.provider && <div className="text-[11px] text-white/40">{s.provider}</div>}
                                </div>
                              </div>
                            </td>
                            <td className="px-2 py-2 text-white/70">
                              {(s.bet_size ?? s.buy_value ?? 0).toFixed(2)}€
                            </td>
                            <td className="px-2 py-2">
                              {currentPayout != null ? (
                                <span className={currentPayout >= (s.bet_size ?? s.buy_value ?? 0) ? "text-green-400" : "text-red-400"}>
                                  {currentPayout.toFixed(2)}€
                                </span>
                              ) : (
                                <span className="text-white/30">—</span>
                              )}
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={draft ?? ""}
                                placeholder={currentPayout != null ? currentPayout.toFixed(2) : "0.00"}
                                onChange={(e) => setDrafts((p) => ({ ...p, [s.id]: e.target.value }))}
                                className="w-full bg-white/5 border border-white/15 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-arena-gold/50"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => savePayout(s)}
                                  disabled={!dirty || savingSlot === s.id}
                                  className="text-xs px-2.5 py-1 rounded border border-arena-gold/40 bg-arena-gold/15 text-white hover:bg-arena-gold/25 disabled:opacity-40"
                                >
                                  {savingSlot === s.id ? "..." : "Guardar"}
                                </button>
                                {s.opened && (
                                  <button
                                    onClick={() => clearPayout(s)}
                                    disabled={savingSlot === s.id}
                                    className="text-xs px-2.5 py-1 rounded border border-white/15 text-white/70 hover:bg-white/10 disabled:opacity-40"
                                    title="Remover payout e marcar como não-aberto"
                                  >
                                    Limpar
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
