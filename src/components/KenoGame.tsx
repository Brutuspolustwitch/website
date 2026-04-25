"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";

const GRID_SIZE  = 80;
const DRAW_COUNT = 20;
const MAX_PICKS  = 10;

const PAYOUTS: Record<number, Record<number, number>> = {
  1:  { 1: 3 },
  2:  { 2: 10,    1: 1 },
  3:  { 3: 30,    2: 2 },
  4:  { 4: 80,    3: 4,    2: 1 },
  5:  { 5: 200,   4: 15,   3: 2 },
  6:  { 6: 500,   5: 35,   4: 5,    3: 1 },
  7:  { 7: 1000,  6: 75,   5: 12,   4: 2 },
  8:  { 8: 2000,  7: 150,  6: 20,   5: 4,    4: 1 },
  9:  { 9: 5000,  8: 300,  7: 40,   6: 6,    5: 2 },
  10: { 10: 10000, 9: 1000, 8: 100, 7: 15,   6: 4,  5: 1, 0: 2 },
};

type Phase = "idle" | "drawing" | "done";

interface SeedInfo {
  seedId:         string;
  serverSeedHash: string;
  clientSeed:     string;
  nonce:          number;
}

export default function KenoGame() {
  const { user } = useAuth();

  // Game state
  const [points,       setPoints]       = useState<number | null>(null);
  const [bet,          setBet]          = useState(50);
  const [picks,        setPicks]        = useState<number[]>([]);
  const [phase,        setPhase]        = useState<Phase>("idle");
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [visibleDrawn, setVisibleDrawn] = useState<number[]>([]);
  const [matchedPicks, setMatchedPicks] = useState<number[]>([]);
  const [multiplier,   setMultiplier]   = useState(0);
  const [net,          setNet]          = useState(0);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  // Provably fair state
  const [seedInfo,        setSeedInfo]        = useState<SeedInfo | null>(null);
  const [showFair,        setShowFair]        = useState(false);
  const [clientSeedInput, setClientSeedInput] = useState("default");
  const [revealedSeed,    setRevealedSeed]    = useState<string | null>(null);
  const [seedLoading,     setSeedLoading]     = useState(false);

  /* ── Fetch SE points ──────────────────────────────────────── */
  const refreshPoints = useCallback(() => {
    if (!user) return;
    fetch(`/api/streamelements?endpoint=user-points&username=${encodeURIComponent(user.login)}`)
      .then((r) => r.json())
      .then((d) => { if (typeof d.points === "number") setPoints(d.points); })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    refreshPoints();
    const interval = setInterval(refreshPoints, 15000);
    return () => clearInterval(interval);
  }, [refreshPoints]);

  /* ── Fetch active seed ────────────────────────────────────── */
  const refreshSeed = useCallback(() => {
    if (!user) return;
    fetch("/api/keno?action=active-seed")
      .then((r) => r.json())
      .then((d) => {
        if (d.seedId) {
          setSeedInfo(d);
          setClientSeedInput(d.clientSeed);
        }
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => { refreshSeed(); }, [refreshSeed]);

  /* ── Draw animation ───────────────────────────────────────── */
  useEffect(() => {
    if (phase !== "drawing" || drawnNumbers.length === 0) return;
    let i = 0;
    setVisibleDrawn([]);
    const interval = setInterval(() => {
      i++;
      setVisibleDrawn(drawnNumbers.slice(0, i));
      if (i >= drawnNumbers.length) {
        clearInterval(interval);
        setPhase("done");
        refreshPoints();
      }
    }, 80);
    return () => clearInterval(interval);
  }, [phase, drawnNumbers, refreshPoints]);

  /* ── Toggle pick ──────────────────────────────────────────── */
  const togglePick = (n: number) => {
    if (phase !== "idle") return;
    setPicks((prev) => {
      if (prev.includes(n)) return prev.filter((x) => x !== n);
      if (prev.length >= MAX_PICKS) return prev;
      return [...prev, n];
    });
  };

  const clearPicks = () => setPicks([]);

  const randomPicks = () => {
    const pool  = Array.from({ length: GRID_SIZE }, (_, i) => i + 1);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    setPicks(pool.slice(0, MAX_PICKS));
  };

  /* ── Play ─────────────────────────────────────────────────── */
  const play = async () => {
    if (!user || picks.length === 0 || loading) return;
    setError(null);
    setLoading(true);
    try {
      const res  = await fetch("/api/keno", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action: "play", bet, picks }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro de API");

      setDrawnNumbers(data.drawnNumbers);
      setMatchedPicks(data.matchedPicks);
      setMultiplier(data.multiplier);
      setNet(data.net);
      setPhase("drawing");
      // Advance nonce display
      if (data.nonce !== undefined) {
        setSeedInfo((prev) => prev ? { ...prev, nonce: data.nonce } : prev);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  /* ── Play again ───────────────────────────────────────────── */
  const playAgain = () => {
    setPhase("idle");
    setDrawnNumbers([]);
    setVisibleDrawn([]);
    setMatchedPicks([]);
    setMultiplier(0);
    setNet(0);
    setError(null);
  };

  /* ── Provably fair helpers ─────────────────────────────────── */
  const applyClientSeed = async () => {
    setSeedLoading(true);
    try {
      const res  = await fetch("/api/keno", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action: "set-client-seed", clientSeed: clientSeedInput }),
      });
      const data = await res.json();
      if (data.serverSeedHash) {
        setSeedInfo((prev) => prev ? { ...prev, clientSeed: clientSeedInput, serverSeedHash: data.serverSeedHash } : prev);
      }
    } catch { /* ignore */ }
    setSeedLoading(false);
  };

  const rotateSeed = async () => {
    setSeedLoading(true);
    setRevealedSeed(null);
    try {
      const res  = await fetch("/api/keno", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action: "rotate-seed" }),
      });
      const data = await res.json();
      if (data.oldServerSeed) setRevealedSeed(data.oldServerSeed);
      if (data.serverSeedHash) {
        setSeedInfo((prev) => prev ? { ...prev, serverSeedHash: data.serverSeedHash, nonce: 0 } : prev);
      }
    } catch { /* ignore */ }
    setSeedLoading(false);
  };

  /* ── Papyrus palette ──────────────────────────────────────── */
  const P = {
    parchment:    "#f5e6c8",
    parchmentMid: "#e8d4a8",
    parchmentDeep:"#d4be8a",
    brown:        "#2c1b0e",
    brownMid:     "#5c3a1e",
    brownLight:   "#8b5e3c",
    gold:         "#c9a227",
    goldDark:     "#9a7a1a",
    panel:        "#ede0c0",
    border:       "#b8952a",
    borderLight:  "#d4b45a",
    cardDefault:  "#b8a070",
    cardDark:     "#a08050",
  };

  const panelStyle = {
    background: P.panel,
    border:     `2px solid ${P.border}`,
    borderRadius: 12,
  } as React.CSSProperties;

  /* ── Current payout table ─────────────────────────────────── */
  const currentPayouts = picks.length > 0 ? PAYOUTS[picks.length] ?? {} : null;

  /* ── Cell state helper ────────────────────────────────────── */
  const getCellState = (n: number) => {
    const isPicked  = picks.includes(n);
    const isDrawn   = visibleDrawn.includes(n);
    const isMatched = matchedPicks.includes(n);

    if (phase === "idle") {
      return isPicked ? "picked" : "idle";
    }
    // drawing or done
    if (isMatched && isDrawn)        return "matched";
    if (isPicked && !isDrawn && phase === "done") return "missed";
    if (isPicked && !isDrawn)        return "picked";
    if (isDrawn)                     return "drawn";
    return "idle";
  };

  const cellColors: Record<string, { bg: string; border: string; color: string; shadow: string }> = {
    idle:    { bg: `linear-gradient(135deg, ${P.cardDefault} 0%, ${P.cardDark} 100%)`, border: P.border,      color: P.brown,    shadow: "0 2px 4px rgba(0,0,0,0.2)" },
    picked:  { bg: "linear-gradient(160deg,#a54e07,#b47e11,#fef1a2,#bc881b,#a54e07)",  border: "#a55d07",     color: "rgb(120,50,5)", shadow: "0 3px 6px rgba(110,80,20,0.4), inset 0 -2px 5px 1px rgba(139,66,8,1), inset 0 -1px 1px 3px rgba(250,227,133,1)" },
    drawn:   { bg: `linear-gradient(135deg, #c8b060 0%, #a89040 100%)`,                border: P.gold,        color: P.brown,    shadow: "0 0 6px rgba(200,160,30,0.5)" },
    matched: { bg: "linear-gradient(135deg,#4a8a2a,#6abf4b)",                          border: "#3a7a1a",     color: "#fff",     shadow: "0 0 12px rgba(100,200,60,0.7)" },
    missed:  { bg: `linear-gradient(135deg, #7a3a2a 0%, #5a2a1a 100%)`,               border: "#6a2a1a",     color: "#f5c0a0",  shadow: "none" },
  };

  /* ── Not logged in ────────────────────────────────────────── */
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4"
        style={{ background: P.parchment, borderRadius: 16, padding: 32 }}>
        <div className="text-5xl">🎱</div>
        <h2 className="text-2xl font-bold font-[family-name:var(--font-display)]" style={{ color: P.brown }}>Keno</h2>
        <p style={{ color: P.brownLight }}>Inicia sessão para jogar</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 rounded-xl"
        style={{ background: `linear-gradient(135deg, ${P.parchmentDeep} 0%, ${P.parchmentMid} 100%)`, border: `2px solid ${P.border}`, boxShadow: "0 4px 16px rgba(0,0,0,0.25)" }}>
        <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] tracking-wider"
          style={{ color: P.brown, textShadow: "0 1px 0 rgba(255,255,200,0.5)" }}>
          🎱 Keno
        </h1>
        <div className="text-right">
          <p className="text-xs uppercase tracking-widest" style={{ color: P.brownLight }}>80 números · 20 sorteados · 1–10 escolhas</p>
          <p className="font-bold text-xl" style={{ color: P.goldDark }}>
            {points !== null ? points.toLocaleString("pt-PT") : "—"} pts
          </p>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 text-sm rounded-lg"
          style={{ background: "#6b2a2a33", border: "1px solid #8b1a1a66", color: "#6b1a1a" }}>
          ⚠️ {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_220px] gap-6">

        {/* ── Left panel ─────────────────────────────────────── */}
        <div style={{ ...panelStyle, padding: 20 }} className="h-fit space-y-4">

          {/* Pick counter */}
          <div className="text-center rounded-lg py-2"
            style={{ background: P.parchmentDeep, border: `1px solid ${P.borderLight}` }}>
            <p className="text-xs uppercase tracking-widest mb-0.5" style={{ color: P.brownLight }}>
              Escolhas
            </p>
            <p className="font-bold text-2xl font-[family-name:var(--font-display)]"
              style={{ color: picks.length === MAX_PICKS ? P.goldDark : P.brown }}>
              {picks.length} / {MAX_PICKS}
            </p>
          </div>

          {/* Bet input */}
          {phase === "idle" && (
            <div className="space-y-2">
              <label className="block text-xs uppercase tracking-wider font-semibold"
                style={{ color: P.brownMid }}>Aposta</label>
              <div className="flex gap-2">
                <button onClick={() => setBet(Math.max(10, Math.floor(bet / 2)))}
                  className="cta-button" style={{ width: "auto", padding: "0 12px", height: "2.4rem" }}>½</button>
                <input
                  type="number" value={bet}
                  onChange={(e) => setBet(Math.min(1000, Math.max(10, parseInt(e.target.value) || 10)))}
                  className="flex-1 text-center focus:outline-none"
                  style={{ background: P.parchment, border: `1px solid ${P.borderLight}`, borderRadius: 8, padding: "6px 10px", color: P.brown, fontWeight: 700 }}
                />
                <button onClick={() => setBet(Math.min(1000, bet * 2))}
                  className="cta-button" style={{ width: "auto", padding: "0 12px", height: "2.4rem" }}>2×</button>
              </div>
              <div className="flex gap-1.5">
                {[25, 50, 100, 250].map((v) => (
                  <button key={v} onClick={() => setBet(v)}
                    className="cta-button-inactive flex-1"
                    style={{ height: "2rem", fontSize: "0.78rem" }}>{v}</button>
                ))}
              </div>
            </div>
          )}

          {/* Quick pick / clear buttons */}
          {phase === "idle" && (
            <div className="flex gap-2">
              <button onClick={randomPicks}
                className="cta-button flex-1" style={{ height: "2.4rem", fontSize: "0.8rem" }}>
                Aleatório
              </button>
              <button onClick={clearPicks}
                className="cta-button-inactive flex-1"
                style={{ height: "2.4rem", fontSize: "0.8rem" }}>
                ✕ Limpar
              </button>
            </div>
          )}

          {/* Play button / result */}
          {phase === "idle" && (
            <>
              <button
                onClick={play}
                disabled={loading || picks.length === 0 || (points !== null && bet > points)}
                className="cta-button"
                style={{ fontSize: "1rem", opacity: (loading || picks.length === 0 || (points !== null && bet > points)) ? 0.5 : 1 }}
              >
                {loading ? "A sortear..." : picks.length === 0 ? "Escolhe 1 a 10 números" : `Jogar ${picks.length} número${picks.length !== 1 ? "s" : ""} (${bet} pts)`}
              </button>
              <p className="text-xs text-center" style={{ color: P.brownLight }}>20 bolas sorteadas de 80 · Escolhe 1 a 10 números</p>
            </>
          )}

          {phase === "drawing" && (
            <div className="text-center py-4">
              <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-2"
                style={{ borderColor: P.gold, borderTopColor: "transparent" }} />
              <p className="font-bold text-sm" style={{ color: P.brownMid }}>
                A sortear... {visibleDrawn.length} / 10
              </p>
            </div>
          )}

          {phase === "done" && (
            <div className="space-y-3">
              <div className="rounded-xl p-4 text-center space-y-1"
                style={net > 0
                  ? { background: "#2a4a1a88", border: "2px solid #4a8a2a" }
                  : net === 0
                  ? { background: "#4a3a1088", border: `2px solid ${P.border}` }
                  : { background: "#4a1a1a88", border: "2px solid #8b2a2a" }
                }>
                <div className="text-3xl mb-1">
                  {net > 0 ? "🏆" : net === 0 ? "😐" : "💀"}
                </div>
                <p className="font-bold font-[family-name:var(--font-display)] text-xl"
                  style={{ color: net > 0 ? "#6abf4b" : net === 0 ? P.gold : "#d45050" }}>
                  {matchedPicks.length} acerto{matchedPicks.length !== 1 ? "s" : ""}
                </p>
                <p className="font-bold text-3xl font-[family-name:var(--font-display)]"
                  style={{ color: P.gold }}>
                  {multiplier > 0 ? `${multiplier}×` : "0×"}
                </p>
                <p className="font-semibold" style={{ color: net > 0 ? "#6abf4b" : net === 0 ? P.parchment : "#d45050" }}>
                  {net > 0 ? `+${net} pts` : net === 0 ? "Empate" : `${net} pts`}
                </p>
              </div>
              <button onClick={playAgain} className="cta-button" style={{ fontSize: "1rem" }}>
                🎱 Jogar de Novo
              </button>
            </div>
          )}
        </div>

        {/* ── Grid ───────────────────────────────────────────── */}
        <div className="rounded-xl p-6"
          style={{ background: `linear-gradient(135deg, ${P.parchmentMid} 0%, ${P.parchment} 100%)`, border: `2px solid ${P.border}` }}>
          <div className="overflow-x-auto">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 52px)", gap: 10, width: "fit-content" }}>
              {Array.from({ length: GRID_SIZE }, (_, i) => {
                const n     = i + 1;
                const state = getCellState(n);
                const c     = cellColors[state];
                const canClick = phase === "idle";

                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => canClick && togglePick(n)}
                    style={{
                      width:           52,
                      height:          52,
                      flexShrink:      0,
                      background:      c.bg,
                      border:          `2px solid ${c.border}`,
                      borderRadius:    8,
                      display:         "flex",
                      alignItems:      "center",
                      justifyContent:  "center",
                      fontSize:        "1.1rem",
                      fontWeight:      700,
                      fontFamily:      "var(--font-display)",
                      letterSpacing:   "0.03em",
                      color:           c.color,
                      cursor:          canClick ? "pointer" : "default",
                      transition:      "all 0.12s",
                      boxShadow:       c.shadow,
                    }}
                  >
                    {n}
                  </button>
                );
              })}
            </div>

            {/* Drawn count footer */}
            {(phase === "drawing" || phase === "done") && (
              <div className="mt-4 flex flex-wrap gap-1.5 justify-center">
                {visibleDrawn.map((n) => {
                  const isMatch = matchedPicks.includes(n);
                  return (
                    <span key={n} className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={isMatch
                        ? { background: "#4a8a2a", color: "#fff", border: "1px solid #3a7a1a" }
                        : { background: P.parchmentDeep, color: P.brownMid, border: `1px solid ${P.borderLight}` }
                      }>
                      {n}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: payout table ──────────────────────────── */}
        <div style={{ ...panelStyle, padding: 16 }} className="h-fit space-y-1">
          <p className="text-xs uppercase tracking-wider font-semibold pb-1" style={{ color: P.brownMid }}>
            Pagamentos{picks.length > 0 ? ` (${picks.length} escolha${picks.length !== 1 ? "s" : ""})` : ""}
          </p>
          {picks.length === 0 ? (
            <p className="text-xs text-center py-4" style={{ color: P.brownLight }}>
              Seleciona números para ver os pagamentos
            </p>
          ) : (
            <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${P.borderLight}` }}>
              <div className="grid grid-cols-2 text-xs font-bold px-3 py-2"
                style={{ background: P.parchmentDeep, color: P.brownMid }}>
                <span>Acertos</span><span className="text-right">Ganho</span>
              </div>
              {Object.entries(currentPayouts ?? {})
                .sort(([a], [b]) => {
                  const na = Number(a), nb = Number(b);
                  // 0 hits at the end
                  if (na === 0) return 1;
                  if (nb === 0) return -1;
                  return nb - na;
                })
                .map(([hits, mult]) => {
                  const isCurrentMatch = phase === "done" && matchedPicks.length === Number(hits);
                  return (
                    <div key={hits} className="grid grid-cols-2 px-3 py-2"
                      style={{
                        fontSize:    "0.82rem",
                        background:  isCurrentMatch ? "rgba(74,138,42,0.2)" : "transparent",
                        color:       isCurrentMatch ? "#4a8a2a" : P.brown,
                        fontWeight:  isCurrentMatch ? 700 : 400,
                        borderTop:   `1px solid ${P.borderLight}`,
                      }}>
                      <span>{hits}/{picks.length} 🎯</span>
                      <span className="text-right font-bold" style={{ color: isCurrentMatch ? "#4a8a2a" : P.goldDark }}>{mult}×</span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* ── Provably Fair section ──────────────────────────────── */}
      <div className="mt-4 rounded-xl overflow-hidden" style={{ border: `2px solid ${P.border}` }}>
        <button
          type="button"
          onClick={() => setShowFair((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-3 text-sm font-semibold"
          style={{ background: P.parchmentMid, color: P.brown }}
        >
          <span>🔒 Provably Fair</span>
          <span style={{ color: P.brownLight }}>{showFair ? "▲" : "▼"}</span>
        </button>

        {showFair && (
          <div className="px-5 py-4 space-y-4 text-sm" style={{ background: P.parchment, color: P.brown }}>
            {/* Server seed hash */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: P.brownMid }}>
                Hash da Server Seed
              </label>
              <input
                type="text"
                readOnly
                value={seedInfo?.serverSeedHash ?? "—"}
                className="w-full rounded px-3 py-2 text-xs font-mono select-all"
                style={{ background: P.parchmentDeep, border: `1px solid ${P.borderLight}`, color: P.brown }}
              />
            </div>

            {/* Client seed */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: P.brownMid }}>
                  Client Seed
                </label>
                <input
                  type="text"
                  value={clientSeedInput}
                  onChange={(e) => setClientSeedInput(e.target.value)}
                  maxLength={64}
                  className="w-full rounded px-3 py-2 text-xs font-mono"
                  style={{ background: P.parchmentDeep, border: `1px solid ${P.borderLight}`, color: P.brown }}
                />
              </div>
              <div className="self-end">
                <button
                  type="button"
                  onClick={applyClientSeed}
                  disabled={seedLoading}
                  className="px-4 py-2 rounded text-sm font-bold"
                  style={{ background: P.gold, color: P.brown, border: `1px solid ${P.goldDark}` }}
                >
                  ✓
                </button>
              </div>
            </div>

            {/* Nonce */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: P.brownMid }}>Nonce</span>
              <span className="font-mono font-bold text-sm" style={{ color: P.brown }}>{seedInfo?.nonce ?? 0}</span>
            </div>

            {/* Rotate seed */}
            <div className="pt-1 border-t" style={{ borderColor: P.borderLight }}>
              <button
                type="button"
                onClick={rotateSeed}
                disabled={seedLoading}
                className="w-full py-2 rounded text-sm font-bold"
                style={{ background: P.brownMid, color: P.parchment, border: `1px solid ${P.brown}` }}
              >
                🔄 Rodar Seed
              </button>
              <p className="text-xs mt-1 text-center" style={{ color: P.brownLight }}>
                Revela a server seed actual e gera uma nova
              </p>
            </div>

            {/* Revealed old seed */}
            {revealedSeed && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: P.brownMid }}>
                  Server Seed Revelada
                </label>
                <input
                  type="text"
                  readOnly
                  value={revealedSeed}
                  className="w-full rounded px-3 py-2 text-xs font-mono select-all"
                  style={{ background: "#f0fff0", border: `1px solid #4a8a2a`, color: P.brown }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
