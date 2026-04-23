"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { supabase, type GuessSession, type GuessPrediction } from "@/lib/supabase";

interface ImportResult {
  success: boolean;
  session_id?: string;
  slots_imported?: number;
  hunt_name?: string;
  error?: string;
}

interface ParsedPreview {
  hunt_name: string;
  currency: string;
  hunt_date?: string;
  start_money: number;
  total_win: number;
  profit: number;
  bonus_count: number;
  avg_multi: number;
  best_multi: number;
  best_slot_name: string;
  bonuses: { slotName: string; betSize: number; payout: number; opened: boolean; provider?: string; isSuperBonus?: boolean; isExtremeBonus?: boolean }[];
}

interface HistorySession {
  id: string;
  title: string;
  status: string;
  currency: string;
  total_buy: number;
  total_result: number;
  profit: number;
  bonus_count: number;
  avg_multi: number;
  best_multi: number;
  best_slot_name: string | null;
  hunt_date: string | null;
  created_at: string;
}

export default function AdminBonusHuntPage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<ParsedPreview | null>(null);
  const [rawData, setRawData] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<HistorySession[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  /* Guess-the-result state */
  const [guessHuntId, setGuessHuntId] = useState<string | null>(null);
  const [guessSession, setGuessSession] = useState<GuessSession | null>(null);
  const [guessTotal, setGuessTotal] = useState(0);
  const [guessPredictions, setGuessPredictions] = useState<GuessPrediction[]>([]);
  const [guessPayoutInput, setGuessPayoutInput] = useState("");
  const [guessMsg, setGuessMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [guessActionLoading, setGuessActionLoading] = useState(false);

  const isAdmin = user?.role === "admin" || user?.role === "configurador" || user?.role === "moderador";

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    const { data, error: err } = await supabase
      .from("bonus_hunt_sessions")
      .select("id, title, status, currency, total_buy, total_result, profit, bonus_count, avg_multi, best_multi, best_slot_name, hunt_date, created_at")
      .order("created_at", { ascending: false });
    if (!err && data) setHistory(data as HistorySession[]);
    setHistoryLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) fetchHistory();
  }, [isAdmin, fetchHistory]);

  /* Guess management helpers */
  const loadGuessData = useCallback(async (huntId: string) => {
    const res = await fetch(`/api/guess-predictions?huntSessionId=${huntId}`);
    if (!res.ok) return;
    const data = await res.json();
    setGuessSession(data.guessSession ?? null);
    setGuessTotal(data.totalCount ?? 0);
    setGuessPredictions(data.predictions ?? []);
  }, []);

  async function toggleGuessPanel(huntId: string) {
    if (guessHuntId === huntId) {
      setGuessHuntId(null);
      return;
    }
    setGuessHuntId(huntId);
    setGuessMsg(null);
    setGuessPayoutInput("");
    await loadGuessData(huntId);
  }

  async function guessAction(body: Record<string, unknown>) {
    setGuessActionLoading(true);
    setGuessMsg(null);
    const res = await fetch("/api/guess-predictions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setGuessActionLoading(false);
    if (res.ok) {
      setGuessSession(data.guessSession ?? null);
      if (guessHuntId) await loadGuessData(guessHuntId);
      setGuessMsg({ ok: true, text: "Feito!" });
    } else {
      setGuessMsg({ ok: false, text: data.error ?? "Erro" });
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/bonus-hunt/${id}`, { method: "DELETE" });
      if (res.ok) {
        setHistory((prev) => prev.filter((s) => s.id !== id));
        setDeleteConfirm(null);
      } else {
        const data = await res.json();
        setError(data.error || "Erro ao eliminar.");
      }
    } catch {
      setError("Erro de rede ao eliminar.");
    } finally {
      setDeleting(null);
    }
  }

  const parseFile = useCallback((file: File) => {
    setError("");
    setResult(null);

    if (!file.name.endsWith(".json")) {
      setError("Apenas ficheiros .json são aceites.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Ficheiro demasiado grande (máx. 5MB).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);

        if (!data.hunt_name || !Array.isArray(data.bonuses)) {
          setError("JSON inválido — campos 'hunt_name' e 'bonuses' são obrigatórios.");
          return;
        }

        setRawData(text);
        setPreview({
          hunt_name: data.hunt_name,
          currency: data.currency || "€",
          hunt_date: data.hunt_date,
          start_money: data.start_money ?? 0,
          total_win: data.total_win ?? 0,
          profit: data.profit ?? 0,
          bonus_count: data.bonus_count ?? data.bonuses.length,
          avg_multi: data.avg_multi ?? 0,
          best_multi: data.best_multi ?? 0,
          best_slot_name: data.best_slot_name ?? "",
          bonuses: data.bonuses.map((b: Record<string, unknown>) => ({
            slotName: (b.slotName as string) || ((b.slot as Record<string, unknown>)?.name as string) || "Unknown",
            betSize: (b.betSize as number) ?? 0,
            payout: (b.payout as number) ?? 0,
            opened: (b.opened as boolean) ?? false,
            provider: ((b.slot as Record<string, unknown>)?.provider as string) || undefined,
            isSuperBonus: (b.isSuperBonus as boolean) ?? false,
            isExtremeBonus: (b.isExtremeBonus as boolean) ?? false,
          })),
        });
      } catch {
        setError("Erro ao ler o ficheiro JSON.");
      }
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) parseFile(file);
    },
    [parseFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) parseFile(file);
    },
    [parseFile]
  );

  async function handleImport() {
    if (!rawData) return;
    setImporting(true);
    setError("");

    try {
      const res = await fetch("/api/bonus-hunt/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: rawData,
      });

      const data: ImportResult = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao importar.");
      } else {
        setResult(data);
        setPreview(null);
        setRawData(null);
        fetchHistory();
      }
    } catch {
      setError("Erro de rede ao importar.");
    } finally {
      setImporting(false);
    }
  }

  function handleReset() {
    setPreview(null);
    setRawData(null);
    setResult(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  if (!isAdmin) {
    return (
      <div className="pt-24 pb-16 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="mt-4 text-arena-smoke/60">Apenas administradores, configuradores e moderadores podem importar bonus hunts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mt-4 space-y-6">
          {/* ── Upload Zone ── */}
          {!preview && !result && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative rounded-xl border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-300
                ${dragOver
                  ? "border-arena-gold bg-arena-gold/5 scale-[1.01]"
                  : "border-arena-steel/30 hover:border-arena-gold/40 hover:bg-white/[0.02]"
                }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="text-4xl mb-4 opacity-50">📂</div>
              <p className="font-[family-name:var(--font-display)] text-arena-smoke text-lg tracking-wide">
                Arrasta o ficheiro JSON ou clica para selecionar
              </p>
              <p className="text-arena-smoke/40 text-sm mt-2">
                Exportação do bonus hunt da outra plataforma (.json, máx. 5MB)
              </p>
            </div>
          )}

          {/* ── Error ── */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-lg bg-red-900/20 border border-red-500/20 p-4 text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Preview ── */}
          <AnimatePresence>
            {preview && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Session Summary */}
                <div className="rounded-xl bg-arena-charcoal/60 border border-arena-steel/20 p-6">
                  <h3 className="font-[family-name:var(--font-display)] text-arena-gold text-lg tracking-wide mb-4">
                    📋 Pré-visualização
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-arena-smoke/50 block text-xs uppercase tracking-wider">Nome</span>
                      <span className="text-arena-smoke font-bold">{preview.hunt_name}</span>
                    </div>
                    <div>
                      <span className="text-arena-smoke/50 block text-xs uppercase tracking-wider">Data</span>
                      <span className="text-arena-smoke">{preview.hunt_date || "—"}</span>
                    </div>
                    <div>
                      <span className="text-arena-smoke/50 block text-xs uppercase tracking-wider">Moeda</span>
                      <span className="text-arena-smoke">{preview.currency}</span>
                    </div>
                    <div>
                      <span className="text-arena-smoke/50 block text-xs uppercase tracking-wider">Start</span>
                      <span className="text-arena-smoke">{preview.currency}{preview.start_money.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-arena-smoke/50 block text-xs uppercase tracking-wider">Total Win</span>
                      <span className="text-green-400">{preview.currency}{preview.total_win.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-arena-smoke/50 block text-xs uppercase tracking-wider">Profit</span>
                      <span className={preview.profit >= 0 ? "text-green-400" : "text-red-400"}>
                        {preview.profit >= 0 ? "+" : ""}{preview.currency}{preview.profit.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-arena-smoke/50 block text-xs uppercase tracking-wider">Bónus</span>
                      <span className="text-arena-smoke">{preview.bonus_count}</span>
                    </div>
                    <div>
                      <span className="text-arena-smoke/50 block text-xs uppercase tracking-wider">Avg Multi</span>
                      <span className="text-arena-smoke">{preview.avg_multi.toFixed(1)}x</span>
                    </div>
                    <div>
                      <span className="text-arena-smoke/50 block text-xs uppercase tracking-wider">Best Multi</span>
                      <span className="text-arena-gold">{preview.best_multi.toFixed(1)}x</span>
                    </div>
                    <div>
                      <span className="text-arena-smoke/50 block text-xs uppercase tracking-wider">Best Slot</span>
                      <span className="text-arena-gold">{preview.best_slot_name}</span>
                    </div>
                  </div>
                </div>

                {/* Slots Table */}
                <div className="rounded-xl bg-arena-charcoal/60 border border-arena-steel/20 overflow-hidden">
                  <div className="p-4 border-b border-arena-steel/10">
                    <h3 className="font-[family-name:var(--font-display)] text-arena-smoke text-sm tracking-wide uppercase">
                      🎰 Slots ({preview.bonuses.length})
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-arena-smoke/50 text-xs uppercase tracking-wider border-b border-arena-steel/10">
                          <th className="px-4 py-3">#</th>
                          <th className="px-4 py-3">Slot</th>
                          <th className="px-4 py-3">Provider</th>
                          <th className="px-4 py-3">Bet</th>
                          <th className="px-4 py-3">Payout</th>
                          <th className="px-4 py-3">Multi</th>
                          <th className="px-4 py-3">Tipo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.bonuses.map((b, i) => {
                          const multi = b.betSize > 0 ? (b.payout / b.betSize).toFixed(1) : "—";
                          return (
                            <tr key={i} className="border-b border-arena-steel/5 hover:bg-white/[0.02]">
                              <td className="px-4 py-2 text-arena-smoke/40">{i + 1}</td>
                              <td className="px-4 py-2 text-arena-smoke font-medium">{b.slotName}</td>
                              <td className="px-4 py-2 text-arena-smoke/60">{b.provider || "—"}</td>
                              <td className="px-4 py-2 text-arena-smoke">{preview.currency}{b.betSize.toFixed(2)}</td>
                              <td className={`px-4 py-2 ${b.payout >= b.betSize ? "text-green-400" : "text-red-400"}`}>
                                {preview.currency}{b.payout.toFixed(2)}
                              </td>
                              <td className="px-4 py-2 text-arena-gold">{multi}x</td>
                              <td className="px-4 py-2">
                                {b.isExtremeBonus && (
                                  <span className="inline-block px-1.5 py-0.5 text-[10px] rounded bg-red-500/20 text-red-400 mr-1">EXTREME</span>
                                )}
                                {b.isSuperBonus && (
                                  <span className="inline-block px-1.5 py-0.5 text-[10px] rounded bg-arena-gold/20 text-arena-gold">SUPER</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                  <button
                    onClick={handleImport}
                    disabled={importing}
                    className="flex-1 py-3 rounded-lg bg-gradient-to-b from-arena-gold/80 to-arena-gold/60 text-arena-dark font-bold font-[family-name:var(--font-display)] tracking-wide text-sm uppercase hover:from-arena-gold hover:to-arena-gold/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {importing ? "A importar..." : `⚔ Importar ${preview.bonuses.length} slots`}
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-6 py-3 rounded-lg border border-arena-steel/30 text-arena-smoke/70 text-sm hover:border-arena-steel/50 hover:text-arena-smoke transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Success ── */}
          <AnimatePresence>
            {result?.success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl bg-green-900/20 border border-green-500/20 p-8 text-center"
              >
                <div className="text-4xl mb-3">✅</div>
                <h3 className="font-[family-name:var(--font-display)] text-green-400 text-xl tracking-wide mb-2">
                  Importação concluída!
                </h3>
                <p className="text-green-400/70 text-sm">
                  &quot;{result.hunt_name}&quot; — {result.slots_imported} slots importados com sucesso.
                </p>
                <button
                  onClick={handleReset}
                  className="mt-6 px-6 py-2.5 rounded-lg bg-arena-gold/10 border border-arena-gold/20 text-arena-gold text-sm font-[family-name:var(--font-display)] tracking-wide hover:bg-arena-gold/20 transition-all cursor-pointer"
                >
                  Importar outro
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── History ── */}
          <div className="mt-10">
            <h3 className="font-[family-name:var(--font-display)] text-arena-gold text-lg tracking-wide mb-4">
              Histórico de Bonus Hunts
            </h3>

            {historyLoading ? (
              <div className="text-arena-smoke/50 text-sm py-8 text-center">A carregar...</div>
            ) : history.length === 0 ? (
              <div className="text-arena-smoke/40 text-sm py-8 text-center">
                Nenhum bonus hunt importado.
              </div>
            ) : (
              <div className="rounded-xl bg-arena-charcoal/60 border border-arena-steel/20 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-arena-smoke/50 text-xs uppercase tracking-wider border-b border-arena-steel/10">
                        <th className="px-4 py-3">Nome</th>
                        <th className="px-4 py-3">Data</th>
                        <th className="px-4 py-3">Estado</th>
                        <th className="px-4 py-3">Bónus</th>
                        <th className="px-4 py-3">Total Buy</th>
                        <th className="px-4 py-3">Total Win</th>
                        <th className="px-4 py-3">Profit</th>
                        <th className="px-4 py-3">Avg Multi</th>
                        <th className="px-4 py-3">Best Multi</th>
                        <th className="px-4 py-3">Best Slot</th>
                        <th className="px-4 py-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((s) => (
                        <React.Fragment key={s.id}>
                        <tr className="border-b border-arena-steel/5 hover:bg-white/[0.02]">
                          <td className="px-4 py-3 text-arena-smoke font-medium max-w-[180px] truncate">{s.title}</td>
                          <td className="px-4 py-3 text-arena-smoke/60">
                            {s.hunt_date
                              ? new Date(s.hunt_date).toLocaleDateString("pt-PT")
                              : new Date(s.created_at).toLocaleDateString("pt-PT")}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-0.5 text-[10px] rounded-full font-bold uppercase tracking-wider ${
                              s.status === "completed"
                                ? "bg-green-500/15 text-green-400"
                                : s.status === "active"
                                  ? "bg-arena-gold/15 text-arena-gold"
                                  : "bg-arena-steel/15 text-arena-smoke/50"
                            }`}>
                              {s.status === "completed" ? "Concluído" : s.status === "active" ? "Ativo" : "Próximo"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-arena-smoke">{s.bonus_count}</td>
                          <td className="px-4 py-3 text-red-400">{s.currency}{s.total_buy.toFixed(2)}</td>
                          <td className="px-4 py-3 text-green-400">{s.currency}{s.total_result.toFixed(2)}</td>
                          <td className={`px-4 py-3 font-bold ${s.profit >= 0 ? "text-green-400" : "text-red-400"}`}>
                            {s.profit >= 0 ? "+" : ""}{s.currency}{s.profit.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-arena-smoke">{s.avg_multi.toFixed(1)}x</td>
                          <td className="px-4 py-3 text-arena-gold">{s.best_multi.toFixed(1)}x</td>
                          <td className="px-4 py-3 text-arena-smoke/60 max-w-[120px] truncate">{s.best_slot_name || "—"}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Guess panel toggle */}
                              <button
                                onClick={() => toggleGuessPanel(s.id)}
                                className={`px-3 py-1.5 text-xs rounded border transition-all cursor-pointer ${
                                  guessHuntId === s.id
                                    ? "border-amber-400/60 bg-amber-400/10 text-amber-400"
                                    : "border-amber-400/20 text-amber-400/60 hover:border-amber-400/40 hover:text-amber-400"
                                }`}
                                title="Gerir apostas de Adivinha o Resultado"
                              >
                                🎯 Apostas
                              </button>

                              {deleteConfirm === s.id ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleDelete(s.id)}
                                  disabled={deleting === s.id}
                                  className="px-3 py-1 text-xs rounded bg-red-600/80 text-white hover:bg-red-600 transition-all disabled:opacity-50 cursor-pointer"
                                >
                                  {deleting === s.id ? "..." : "Confirmar"}
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(null)}
                                  className="px-3 py-1 text-xs rounded border border-arena-steel/30 text-arena-smoke/50 hover:text-arena-smoke transition-all cursor-pointer"
                                >
                                  Não
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirm(s.id)}
                                className="px-3 py-1.5 text-xs rounded border border-red-500/20 text-red-400/70 hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/5 transition-all cursor-pointer"
                                title="Eliminar bonus hunt"
                              >
                                Eliminar
                              </button>
                            )}
                            </div>
                          </td>
                        </tr>

                        {/* ── Guess panel (expandable) ── */}
                        {guessHuntId === s.id && (
                          <tr>
                            <td colSpan={11} className="px-4 py-4 bg-amber-950/10 border-t border-amber-400/10">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="font-[family-name:var(--font-display)] text-amber-400 text-xs tracking-widest uppercase">
                                    🎯 Adivinha o Resultado — {s.title}
                                  </span>
                                  {guessSession && (
                                    <span className="text-xs font-[family-name:var(--font-display)] tracking-wider" style={{
                                      color: guessSession.status === "resolved" ? "#d4a843" : guessSession.betting_open ? "#22c55e" : "#8b1a1a",
                                    }}>
                                      {guessSession.status === "resolved" ? "✅ Resolvido" : guessSession.betting_open ? "🟢 Aberto" : guessSession.status === "locked" ? "🔐 Bloqueado" : "🔒 Fechado"}
                                      {" · "}{guessTotal} previsões
                                    </span>
                                  )}
                                </div>

                                {!guessSession ? (
                                  <button
                                    onClick={() => guessAction({ action: "create", huntSessionId: s.id })}
                                    disabled={guessActionLoading}
                                    className="px-4 py-1.5 text-xs rounded border border-amber-400/30 text-amber-400/80 hover:bg-amber-400/10 hover:text-amber-400 transition-all disabled:opacity-50 cursor-pointer font-[family-name:var(--font-display)] tracking-widest uppercase"
                                  >
                                    + Criar Sessão de Apostas
                                  </button>
                                ) : (
                                  <div className="flex flex-wrap gap-2 items-center">
                                    {/* Toggle open/close */}
                                    {guessSession.status === "open" && (
                                      <button
                                        onClick={() => guessAction({ action: "toggle_betting", guessSessionId: guessSession.id })}
                                        disabled={guessActionLoading}
                                        className="px-3 py-1.5 text-xs rounded border transition-all disabled:opacity-50 cursor-pointer font-[family-name:var(--font-display)] tracking-widest uppercase"
                                        style={{
                                          borderColor: guessSession.betting_open ? "rgba(139,26,26,0.4)" : "rgba(34,197,94,0.4)",
                                          color: guessSession.betting_open ? "#8b1a1a" : "#22c55e",
                                          background: guessSession.betting_open ? "rgba(139,26,26,0.1)" : "rgba(34,197,94,0.08)",
                                        }}
                                      >
                                        {guessSession.betting_open ? "🔒 Fechar Apostas" : "🟢 Abrir Apostas"}
                                      </button>
                                    )}

                                    {/* Lock permanently */}
                                    {guessSession.status === "open" && !guessSession.betting_open && (
                                      <button
                                        onClick={() => guessAction({ action: "lock", guessSessionId: guessSession.id })}
                                        disabled={guessActionLoading}
                                        className="px-3 py-1.5 text-xs rounded border border-amber-400/30 text-amber-400/70 hover:bg-amber-400/10 transition-all disabled:opacity-50 cursor-pointer font-[family-name:var(--font-display)] tracking-widest uppercase"
                                      >
                                        🔐 Bloquear
                                      </button>
                                    )}

                                    {/* Resolve form */}
                                    {guessSession.status !== "resolved" && (
                                      <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                                        <input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          placeholder="Payout total (ex: 1842.50)"
                                          value={guessPayoutInput}
                                          onChange={(e) => setGuessPayoutInput(e.target.value)}
                                          className="flex-1 bg-arena-charcoal border border-arena-gold/20 rounded px-2 py-1 text-arena-smoke text-xs font-[family-name:var(--font-ui)] focus:outline-none focus:border-amber-400/50"
                                        />
                                        <button
                                          onClick={() => guessAction({ action: "resolve", guessSessionId: guessSession.id, finalPayout: parseFloat(guessPayoutInput.replace(",", ".")) })}
                                          disabled={guessActionLoading || !guessPayoutInput}
                                          className="px-3 py-1.5 text-xs rounded text-white font-[family-name:var(--font-display)] tracking-widest uppercase disabled:opacity-50 cursor-pointer"
                                          style={{ background: "linear-gradient(135deg, #8b6914, #b89230)" }}
                                        >
                                          ⚔ Resolver
                                        </button>
                                      </div>
                                    )}

                                    {/* Winner display */}
                                    {guessSession.status === "resolved" && guessSession.winner_display_name && (
                                      <div className="flex items-center gap-3 px-3 py-1.5 rounded border border-arena-gold/25 bg-arena-gold/5">
                                        <span className="text-sm">🏆</span>
                                        <div>
                                          <span className="font-[family-name:var(--font-ui)] text-xs font-bold text-arena-gold">{guessSession.winner_display_name}</span>
                                          <span className="text-arena-smoke/60 text-xs ml-2">
                                            apostou {guessSession.winner_predicted_amount?.toFixed(2)}€
                                            {guessSession.winner_diff != null && ` (±${guessSession.winner_diff.toFixed(2)}€)`}
                                          </span>
                                          <span className="text-green-400 text-xs ml-2">
                                            real: {guessSession.final_payout?.toFixed(2)}€
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Predictions mini list */}
                                {guessPredictions.length > 0 && (
                                  <div className="mt-1 max-h-40 overflow-y-auto rounded border border-arena-steel/20 divide-y divide-arena-steel/10">
                                    {guessPredictions.map((p, i) => {
                                      const isWinner = guessSession?.winner_user_id === p.user_id;
                                      const diff = guessSession?.final_payout != null ? Math.abs(p.predicted_amount - guessSession.final_payout) : null;
                                      return (
                                        <div key={p.id} className="flex items-center justify-between px-3 py-1.5 text-xs" style={{ background: isWinner ? "rgba(139,105,20,0.1)" : "transparent" }}>
                                          <div className="flex items-center gap-2">
                                            <span className="text-arena-smoke/40 w-5 text-right">{isWinner ? "🏆" : `${i + 1}`}</span>
                                            <span className={`font-[family-name:var(--font-ui)] ${isWinner ? "text-arena-gold font-bold" : "text-arena-smoke"}`}>{p.display_name}</span>
                                          </div>
                                          <div className="text-right">
                                            <span className={`font-bold ${isWinner ? "text-arena-gold" : "text-arena-smoke"}`}>{p.predicted_amount.toFixed(2)}€</span>
                                            {diff != null && <span className="text-arena-smoke/50 ml-2">±{diff.toFixed(2)}€</span>}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {guessMsg && (
                                  <p className="text-xs font-[family-name:var(--font-display)] tracking-wide" style={{ color: guessMsg.ok ? "#22c55e" : "#8b1a1a" }}>
                                    {guessMsg.ok ? "✓" : "✗"} {guessMsg.text}
                                  </p>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
