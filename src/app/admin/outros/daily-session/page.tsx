"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import type { CasinoOfferRow } from "@/lib/supabase";

/* ═══════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════ */

interface DailySessionRow {
  id: string;
  title: string;
  session_date: string;
  casino_id: string | null;
  spotify_url: string | null;
  deposits: number;
  withdrawals: number;
  bonuses_count: number;
  biggest_win: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/* ═══════════════════════════════════════════════════════════════════
   ADMIN DAILY SESSION PAGE
   ═══════════════════════════════════════════════════════════════════ */

export default function AdminDailySessionPage() {
  const [session, setSession] = useState<DailySessionRow | null>(null);
  const [casinos, setCasinos] = useState<CasinoOfferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("Sessão do Dia");
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split("T")[0]);
  const [casinoId, setCasinoId] = useState("");
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [deposits, setDeposits] = useState("0");
  const [withdrawals, setWithdrawals] = useState("0");
  const [bonusesCount, setBonusesCount] = useState("0");
  const [biggestWin, setBiggestWin] = useState("0");
  const [isActive, setIsActive] = useState(true);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Load active session + all casinos
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sessionRes, casinoRes] = await Promise.all([
        supabase.from("daily_sessions").select("*").eq("is_active", true).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("casino_offers").select("*").eq("visible", true).order("sort_order"),
      ]);

      if (casinoRes.data) setCasinos(casinoRes.data);

      if (sessionRes.data) {
        const s = sessionRes.data;
        setSession(s);
        setTitle(s.title);
        setSessionDate(s.session_date);
        setCasinoId(s.casino_id || "");
        setSpotifyUrl(s.spotify_url || "");
        setDeposits(String(s.deposits));
        setWithdrawals(String(s.withdrawals));
        setBonusesCount(String(s.bonuses_count));
        setBiggestWin(String(s.biggest_win));
        setIsActive(s.is_active);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Save session
  const handleSave = async () => {
    setSaving(true);
    try {
      const body = {
        id: session?.id,
        title,
        session_date: sessionDate,
        casino_id: casinoId || null,
        spotify_url: spotifyUrl || null,
        deposits: parseFloat(deposits) || 0,
        withdrawals: parseFloat(withdrawals) || 0,
        bonuses_count: parseInt(bonusesCount) || 0,
        biggest_win: parseFloat(biggestWin) || 0,
        is_active: isActive,
      };

      const res = await fetch("/api/daily-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(`Erro: ${data.error}`);
        return;
      }

      setSession(data.session);
      showToast("Sessão guardada com sucesso!");
    } finally {
      setSaving(false);
    }
  };

  // New session
  const handleNewSession = () => {
    setSession(null);
    setTitle("Sessão do Dia");
    setSessionDate(new Date().toISOString().split("T")[0]);
    setCasinoId("");
    setSpotifyUrl("");
    setDeposits("0");
    setWithdrawals("0");
    setBonusesCount("0");
    setBiggestWin("0");
    setIsActive(true);
  };

  const net = (parseFloat(withdrawals) || 0) - (parseFloat(deposits) || 0);
  const netColor = net > 0 ? "text-green-400" : net < 0 ? "text-red-400" : "text-arena-gold";
  const netGlow = net > 0 ? "shadow-[0_0_15px_rgba(34,197,94,0.2)]" : net < 0 ? "shadow-[0_0_15px_rgba(239,68,68,0.2)]" : "";

  const selectedCasino = casinos.find((c) => c.id === casinoId);

  // Spotify embed preview
  let spotifyEmbed = spotifyUrl;
  if (spotifyUrl.includes("open.spotify.com") && !spotifyUrl.includes("/embed/")) {
    spotifyEmbed = spotifyUrl.replace("open.spotify.com/", "open.spotify.com/embed/");
    if (!spotifyEmbed.includes("?")) spotifyEmbed += "?utm_source=generator&theme=0";
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-arena-gold/30 border-t-arena-gold rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-arena-black p-4 sm:p-6 lg:p-8">
      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-4 z-50 bg-green-900/90 text-green-200 border border-green-500/30 px-4 py-2 rounded-lg text-sm shadow-lg"
        >
          {toast}
        </motion.div>
      )}

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-display)] text-arena-gold">
              Sessão do Dia
            </h1>
            <p className="text-sm text-arena-smoke mt-1">
              {session ? "A editar sessão ativa" : "Criar nova sessão"}
            </p>
          </div>
          <button
            onClick={handleNewSession}
            className="px-4 py-2 text-sm rounded-lg bg-arena-iron border border-arena-gold/20 text-arena-gold hover:bg-arena-gold/10 transition-colors font-[family-name:var(--font-display)]"
          >
            + Nova Sessão
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ── LEFT: Form Fields ────────────────────────── */}
          <div className="space-y-6">

            {/* Session Settings */}
            <div className="bg-arena-dark/80 rounded-lg border border-arena-gold/15 p-5 space-y-4">
              <h2 className="text-sm font-bold text-arena-gold uppercase tracking-wider font-[family-name:var(--font-display)]">
                Definições da Sessão
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-arena-smoke mb-1">Título</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-arena-iron/60 border border-arena-gold/15 rounded-lg px-3 py-2 text-sm text-arena-white focus:outline-none focus:border-arena-gold/40 transition-colors"
                    placeholder="Sessão do Dia"
                  />
                </div>

                <div>
                  <label className="block text-xs text-arena-smoke mb-1">Data</label>
                  <input
                    type="date"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    className="w-full bg-arena-iron/60 border border-arena-gold/15 rounded-lg px-3 py-2 text-sm text-arena-white focus:outline-none focus:border-arena-gold/40 transition-colors [color-scheme:dark]"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-xs text-arena-smoke">Sessão Ativa</label>
                  <button
                    onClick={() => setIsActive(!isActive)}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                      isActive ? "bg-green-600" : "bg-arena-iron"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-300 ${
                        isActive ? "translate-x-6" : ""
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Casino Selector */}
            <div className="bg-arena-dark/80 rounded-lg border border-arena-gold/15 p-5 space-y-4">
              <h2 className="text-sm font-bold text-arena-gold uppercase tracking-wider font-[family-name:var(--font-display)]">
                Casino Ativo
              </h2>

              <select
                value={casinoId}
                onChange={(e) => setCasinoId(e.target.value)}
                className="w-full bg-arena-iron/60 border border-arena-gold/15 rounded-lg px-3 py-2 text-sm text-arena-white focus:outline-none focus:border-arena-gold/40 transition-colors [color-scheme:dark]"
              >
                <option value="">Selecionar casino...</option>
                {casinos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Casino Preview */}
              {selectedCasino && (
                <div className="rounded-lg border border-arena-gold/10 bg-arena-iron/40 p-3 flex items-center gap-3">
                  {selectedCasino.logo_url && (
                    <img src={selectedCasino.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  )}
                  <div>
                    <p className="text-sm text-arena-white font-bold">{selectedCasino.name}</p>
                    <p className="text-xs text-arena-smoke">{selectedCasino.headline} {selectedCasino.bonus_value}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Spotify Control */}
            <div className="bg-arena-dark/80 rounded-lg border border-arena-gold/15 p-5 space-y-4">
              <h2 className="text-sm font-bold text-arena-gold uppercase tracking-wider font-[family-name:var(--font-display)]">
                Spotify Playlist
              </h2>

              <input
                type="url"
                value={spotifyUrl}
                onChange={(e) => setSpotifyUrl(e.target.value)}
                className="w-full bg-arena-iron/60 border border-arena-gold/15 rounded-lg px-3 py-2 text-sm text-arena-white focus:outline-none focus:border-arena-gold/40 transition-colors"
                placeholder="https://open.spotify.com/playlist/..."
              />

              {spotifyUrl && (
                <div className="rounded-lg overflow-hidden border border-arena-gold/10">
                  <iframe
                    src={spotifyEmbed}
                    width="100%"
                    height="152"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    className="bg-arena-dark"
                  />
                </div>
              )}
            </div>

            {/* Financial Tracking */}
            <div className="bg-arena-dark/80 rounded-lg border border-arena-gold/15 p-5 space-y-4">
              <h2 className="text-sm font-bold text-arena-gold uppercase tracking-wider font-[family-name:var(--font-display)]">
                Financeiro
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-arena-smoke mb-1">Depósitos (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={deposits}
                    onChange={(e) => setDeposits(e.target.value)}
                    className="w-full bg-arena-iron/60 border border-arena-gold/15 rounded-lg px-3 py-2 text-sm text-arena-white focus:outline-none focus:border-arena-gold/40 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-arena-smoke mb-1">Levantamentos (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={withdrawals}
                    onChange={(e) => setWithdrawals(e.target.value)}
                    className="w-full bg-arena-iron/60 border border-arena-gold/15 rounded-lg px-3 py-2 text-sm text-arena-white focus:outline-none focus:border-arena-gold/40 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-arena-smoke mb-1">Bónus Jogados</label>
                  <input
                    type="number"
                    min="0"
                    value={bonusesCount}
                    onChange={(e) => setBonusesCount(e.target.value)}
                    className="w-full bg-arena-iron/60 border border-arena-gold/15 rounded-lg px-3 py-2 text-sm text-arena-white focus:outline-none focus:border-arena-gold/40 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-arena-smoke mb-1">Maior Vitória (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={biggestWin}
                    onChange={(e) => setBiggestWin(e.target.value)}
                    className="w-full bg-arena-iron/60 border border-arena-gold/15 rounded-lg px-3 py-2 text-sm text-arena-white focus:outline-none focus:border-arena-gold/40 transition-colors"
                  />
                </div>
              </div>

              {/* Net Result Preview */}
              <div className={`rounded-lg bg-arena-iron/40 border border-arena-gold/10 p-4 text-center ${netGlow}`}>
                <p className="text-xs text-arena-ash uppercase tracking-wider mb-1">Resultado Líquido</p>
                <p className={`text-3xl font-bold ${netColor}`}>
                  {net >= 0 ? "+" : ""}{net.toFixed(2)}€
                </p>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-arena-crimson to-red-800 hover:from-red-700 hover:to-red-600 text-white font-bold text-sm uppercase tracking-wider transition-all duration-300 border border-red-500/30 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] disabled:opacity-50 disabled:cursor-not-allowed font-[family-name:var(--font-display)]"
            >
              {saving ? "A guardar..." : session ? "⚔ Atualizar Sessão ⚔" : "⚔ Criar Sessão ⚔"}
            </button>
          </div>

          {/* ── RIGHT: Live Preview ──────────────────────── */}
          <div className="space-y-6">
            <h2 className="text-sm font-bold text-arena-gold uppercase tracking-wider font-[family-name:var(--font-display)]">
              Pré-visualização
            </h2>

            {/* Stats Preview */}
            <div className="grid grid-cols-3 gap-3">
              <div className={`rounded-lg bg-arena-iron/60 border border-red-500/20 p-3 text-center ${parseFloat(deposits) > 0 ? "shadow-[0_0_15px_rgba(239,68,68,0.15)]" : ""}`}>
                <p className="text-[10px] text-arena-ash uppercase tracking-wider">Depósitos</p>
                <p className="text-lg font-bold text-red-400">{parseFloat(deposits || "0").toFixed(2)}€</p>
              </div>
              <div className={`rounded-lg bg-arena-iron/60 border border-green-500/20 p-3 text-center ${parseFloat(withdrawals) > 0 ? "shadow-[0_0_15px_rgba(34,197,94,0.15)]" : ""}`}>
                <p className="text-[10px] text-arena-ash uppercase tracking-wider">Levantamentos</p>
                <p className="text-lg font-bold text-green-400">{parseFloat(withdrawals || "0").toFixed(2)}€</p>
              </div>
              <div className={`rounded-lg bg-arena-iron/60 border p-3 text-center ${net > 0 ? "border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.15)]" : net < 0 ? "border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.15)]" : "border-arena-gold/20"}`}>
                <p className="text-[10px] text-arena-ash uppercase tracking-wider">Resultado</p>
                <p className={`text-lg font-bold ${netColor}`}>{net >= 0 ? "+" : ""}{net.toFixed(2)}€</p>
              </div>
            </div>

            {/* Casino Preview */}
            {selectedCasino && (
              <div className="rounded-lg border border-arena-gold/20 bg-gradient-to-b from-arena-iron/60 to-arena-dark/80 overflow-hidden">
                {selectedCasino.banner_url && (
                  <div className="relative h-32 overflow-hidden">
                    <img src={selectedCasino.banner_url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-arena-dark via-arena-dark/30 to-transparent" />
                  </div>
                )}
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    {selectedCasino.logo_url && (
                      <img src={selectedCasino.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                    )}
                    <p className="text-arena-white font-bold font-[family-name:var(--font-display)]">{selectedCasino.name}</p>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-arena-crimson/60 text-[10px] text-white uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                      A Jogar
                    </span>
                  </div>
                  <p className="text-sm text-arena-smoke">{selectedCasino.headline} <span className="text-arena-gold">{selectedCasino.bonus_value}</span></p>
                </div>
              </div>
            )}

            {/* Spotify Preview */}
            {spotifyUrl && (
              <div className="rounded-lg overflow-hidden border border-arena-gold/15">
                <div className="bg-arena-iron/80 px-3 py-2 flex items-center gap-2 border-b border-arena-gold/10">
                  <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                  <span className="text-xs text-arena-gold-light font-[family-name:var(--font-display)]">Arena Playlist</span>
                </div>
                <iframe
                  src={spotifyEmbed}
                  width="100%"
                  height="152"
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  className="bg-arena-dark"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
