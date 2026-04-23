"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { hasRole } from "@/lib/roles";
import { supabase, type BonusHuntSession, type GuessSession, type GuessPrediction } from "@/lib/supabase";

interface HuntWithGuess extends BonusHuntSession {
  guessSession?: GuessSession | null;
}

export default function AdminAdivinhaPage() {
  const { user } = useAuth();
  const [hunts, setHunts] = useState<HuntWithGuess[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHuntId, setSelectedHuntId] = useState<string | null>(null);
  const [guessSession, setGuessSession] = useState<GuessSession | null>(null);
  const [predictions, setPredictions] = useState<GuessPrediction[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [finalPayoutInput, setFinalPayoutInput] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const isAllowed = hasRole(user?.role, "configurador");

  /* Load bonus hunt sessions */
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("bonus_hunt_sessions")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setHunts(data as BonusHuntSession[]);
      setLoading(false);
    })();
  }, []);

  /* Load guess data for selected hunt */
  const loadGuessData = useCallback(async (huntId: string) => {
    const res = await fetch(`/api/guess-predictions?huntSessionId=${huntId}`);
    if (!res.ok) return;
    const data = await res.json();
    setGuessSession(data.guessSession ?? null);
    setPredictions(data.predictions ?? []);
    setTotalCount(data.totalCount ?? 0);
  }, []);

  useEffect(() => {
    if (!selectedHuntId) return;
    loadGuessData(selectedHuntId);
  }, [selectedHuntId, loadGuessData]);

  async function callAction(body: Record<string, unknown>) {
    setActionLoading(true);
    setMsg(null);
    const res = await fetch("/api/guess-predictions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setActionLoading(false);
    if (res.ok) {
      setGuessSession(data.guessSession);
      if (data.predictions) setPredictions(data.predictions);
      if (selectedHuntId) await loadGuessData(selectedHuntId);
      setMsg({ ok: true, text: "Operação concluída!" });
    } else {
      setMsg({ ok: false, text: data.error ?? "Erro" });
    }
  }

  async function createGuessSession() {
    if (!selectedHuntId) return;
    await callAction({ action: "create", huntSessionId: selectedHuntId });
  }

  async function toggleBetting() {
    if (!guessSession) return;
    await callAction({ action: "toggle_betting", guessSessionId: guessSession.id });
  }

  async function lockBetting() {
    if (!guessSession) return;
    await callAction({ action: "lock", guessSessionId: guessSession.id });
  }

  async function resolveGuess() {
    if (!guessSession || !finalPayoutInput) return;
    const payout = parseFloat(finalPayoutInput.replace(",", "."));
    if (isNaN(payout) || payout < 0) {
      setMsg({ ok: false, text: "Valor de payout inválido" });
      return;
    }
    await callAction({ action: "resolve", guessSessionId: guessSession.id, finalPayout: payout });
    if (selectedHuntId) await loadGuessData(selectedHuntId);
  }

  if (!isAllowed) {
    return (
      <div className="pt-24 pb-16 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-arena-smoke">Sem permissão.</p>
        </div>
      </div>
    );
  }

  const selectedHunt = hunts.find((h) => h.id === selectedHuntId);

  const statusColor = guessSession?.status === "resolved"
    ? "#d4a843"
    : guessSession?.betting_open
    ? "#22c55e"
    : "#8b1a1a";

  const statusLabel = guessSession?.status === "resolved"
    ? "✅ Resolvido"
    : guessSession?.betting_open
    ? "🟢 Apostas Abertas"
    : guessSession
    ? "🔒 Apostas Fechadas"
    : "—";

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* Header */}
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-arena-gold tracking-wide">
            🎯 Adivinha o Resultado
          </h1>
          <p className="text-arena-smoke text-sm mt-1">
            Gestão das apostas e previsões dos jogadores.
          </p>
        </div>

        {/* Select bonus hunt session */}
        <div className="bg-arena-charcoal/50 border border-arena-gold/20 rounded-lg p-4">
          <label className="block font-[family-name:var(--font-display)] text-xs tracking-widest text-arena-smoke uppercase mb-2">
            Selecionar Bonus Hunt
          </label>
          {loading ? (
            <p className="text-arena-smoke text-sm">A carregar…</p>
          ) : (
            <select
              value={selectedHuntId ?? ""}
              onChange={(e) => {
                setSelectedHuntId(e.target.value || null);
                setGuessSession(null);
                setPredictions([]);
                setTotalCount(0);
                setMsg(null);
                setFinalPayoutInput("");
              }}
              className="w-full bg-arena-charcoal border border-arena-gold/30 rounded px-3 py-2 text-arena-smoke text-sm font-[family-name:var(--font-ui)] focus:outline-none focus:border-arena-gold/60"
            >
              <option value="">— Escolhe um Bonus Hunt —</option>
              {hunts.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.title} — {h.hunt_date ?? h.created_at.slice(0, 10)} [{h.status}]
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Guess session management */}
        {selectedHuntId && (
          <div className="space-y-4">

            {/* Status card */}
            <div className="bg-arena-charcoal/50 border border-arena-gold/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-[family-name:var(--font-display)] text-arena-gold text-lg">
                    {selectedHunt?.title}
                  </h2>
                  <p className="font-[family-name:var(--font-display)] text-xs tracking-widest mt-1" style={{ color: statusColor }}>
                    {statusLabel}
                  </p>
                </div>
                {guessSession && (
                  <div className="text-right">
                    <p className="font-[family-name:var(--font-ui)] text-2xl font-bold text-arena-gold">{totalCount}</p>
                    <p className="font-[family-name:var(--font-display)] text-xs text-arena-smoke tracking-widest">PREVISÕES</p>
                  </div>
                )}
              </div>

              {/* No guess session yet */}
              {!guessSession ? (
                <button
                  onClick={createGuessSession}
                  disabled={actionLoading}
                  className="w-full py-2 font-[family-name:var(--font-display)] text-xs tracking-widest uppercase text-arena-gold border border-arena-gold/40 rounded hover:bg-arena-gold/10 transition-colors disabled:opacity-50"
                >
                  + Criar Sessão de Apostas para Este Hunt
                </button>
              ) : (
                <div className="flex flex-wrap gap-3">

                  {/* Toggle betting open/closed */}
                  {guessSession.status === "open" && (
                    <button
                      onClick={toggleBetting}
                      disabled={actionLoading}
                      className="flex-1 py-2 font-[family-name:var(--font-display)] text-xs tracking-widest uppercase rounded transition-colors disabled:opacity-50"
                      style={{
                        background: guessSession.betting_open
                          ? "rgba(139,26,26,0.2)"
                          : "rgba(34,197,94,0.15)",
                        color: guessSession.betting_open ? "#8b1a1a" : "#22c55e",
                        border: `1px solid ${guessSession.betting_open ? "rgba(139,26,26,0.4)" : "rgba(34,197,94,0.4)"}`,
                      }}
                    >
                      {guessSession.betting_open ? "🔒 Fechar Apostas" : "🟢 Abrir Apostas"}
                    </button>
                  )}

                  {/* Lock permanently */}
                  {guessSession.status === "open" && !guessSession.betting_open && (
                    <button
                      onClick={lockBetting}
                      disabled={actionLoading}
                      className="flex-1 py-2 font-[family-name:var(--font-display)] text-xs tracking-widest uppercase text-amber-400 border border-amber-400/40 rounded hover:bg-amber-400/10 transition-colors disabled:opacity-50"
                    >
                      🔐 Bloquear Definitivamente
                    </button>
                  )}
                </div>
              )}

              {msg && (
                <p
                  className="mt-3 font-[family-name:var(--font-display)] text-xs tracking-wide"
                  style={{ color: msg.ok ? "#22c55e" : "#8b1a1a" }}
                >
                  {msg.ok ? "✓" : "✗"} {msg.text}
                </p>
              )}
            </div>

            {/* Winner card (if resolved) */}
            {guessSession?.status === "resolved" && (
              <div className="bg-arena-charcoal/50 border border-arena-gold/40 rounded-lg p-4">
                <h3 className="font-[family-name:var(--font-display)] text-arena-gold text-sm tracking-widest uppercase mb-3">🏆 Resultado Final</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="font-[family-name:var(--font-display)] text-xs text-arena-smoke tracking-widest uppercase mb-1">Payout Total</p>
                    <p className="font-[family-name:var(--font-ui)] text-xl font-bold text-green-400">
                      {guessSession.final_payout?.toFixed(2)}€
                    </p>
                  </div>
                  <div>
                    <p className="font-[family-name:var(--font-display)] text-xs text-arena-smoke tracking-widest uppercase mb-1">Vencedor</p>
                    <p className="font-[family-name:var(--font-ui)] text-lg font-bold text-arena-gold">
                      {guessSession.winner_display_name ?? "—"}
                    </p>
                    {guessSession.winner_predicted_amount != null && (
                      <p className="font-[family-name:var(--font-display)] text-xs text-arena-smoke">
                        Apostou: {guessSession.winner_predicted_amount.toFixed(2)}€
                        {guessSession.winner_diff != null && ` (±${guessSession.winner_diff.toFixed(2)}€)`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Resolve form */}
            {guessSession && guessSession.status !== "resolved" && (
              <div className="bg-arena-charcoal/50 border border-arena-gold/20 rounded-lg p-4">
                <h3 className="font-[family-name:var(--font-display)] text-arena-gold text-sm tracking-widest uppercase mb-3">
                  Resolver — Inserir Resultado Final
                </h3>
                <p className="text-arena-smoke text-xs mb-3">
                  Após a abertura dos bónus, insere o payout total para determinar o vencedor (previsão mais próxima).
                </p>
                <div className="flex gap-3">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Total payout (ex: 1842.50)"
                    value={finalPayoutInput}
                    onChange={(e) => setFinalPayoutInput(e.target.value)}
                    className="flex-1 bg-arena-charcoal border border-arena-gold/30 rounded px-3 py-2 text-arena-smoke text-sm font-[family-name:var(--font-ui)] focus:outline-none focus:border-arena-gold/60"
                  />
                  <button
                    onClick={resolveGuess}
                    disabled={actionLoading || !finalPayoutInput}
                    className="px-5 py-2 font-[family-name:var(--font-display)] text-xs tracking-widest uppercase text-white rounded transition-colors disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #8b6914, #b89230)" }}
                  >
                    {actionLoading ? "…" : "⚔ Resolver"}
                  </button>
                </div>
              </div>
            )}

            {/* Predictions table */}
            {guessSession && predictions.length > 0 && (
              <div className="bg-arena-charcoal/50 border border-arena-gold/20 rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-arena-gold/20 flex items-center justify-between">
                  <h3 className="font-[family-name:var(--font-display)] text-arena-gold text-sm tracking-widest uppercase">
                    Previsões ({predictions.length})
                  </h3>
                  {guessSession.final_payout != null && (
                    <span className="font-[family-name:var(--font-display)] text-xs text-arena-smoke">
                      Resultado: <strong className="text-green-400">{guessSession.final_payout.toFixed(2)}€</strong>
                    </span>
                  )}
                </div>
                <div className="divide-y divide-arena-gold/10 max-h-96 overflow-y-auto">
                  {predictions.map((p, i) => {
                    const isWinner = guessSession.winner_user_id === p.user_id;
                    const diff = guessSession.final_payout != null
                      ? Math.abs(p.predicted_amount - guessSession.final_payout)
                      : null;
                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between px-4 py-2"
                        style={{ background: isWinner ? "rgba(139,105,20,0.12)" : "transparent" }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-[family-name:var(--font-display)] text-xs text-arena-smoke w-6 text-right">
                            {isWinner ? "🏆" : `${i + 1}`}
                          </span>
                          <span className={`font-[family-name:var(--font-ui)] text-sm font-semibold ${isWinner ? "text-arena-gold" : "text-arena-smoke"}`}>
                            {p.display_name}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className={`font-[family-name:var(--font-ui)] text-sm font-bold ${isWinner ? "text-arena-gold" : "text-arena-smoke"}`}>
                            {p.predicted_amount.toFixed(2)}€
                          </span>
                          {diff != null && (
                            <span className="font-[family-name:var(--font-display)] text-xs text-arena-smoke block">
                              ±{diff.toFixed(2)}€
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {guessSession && predictions.length === 0 && totalCount === 0 && (
              <p className="text-arena-smoke text-sm text-center py-4">
                Ainda não há previsões para esta sessão.
              </p>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
