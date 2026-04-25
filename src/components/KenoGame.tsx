"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";

const GRID_SIZE  = 40;
const MAX_PICKS  = 10;

const PAYOUTS: Record<number, Record<number, number>> = {
  1:  { 1: 3.0 },
  2:  { 2: 12.0, 1: 1.5 },
  3:  { 3: 40.0, 2: 3.0 },
  4:  { 4: 70.0, 3: 5.0, 2: 1.5 },
  5:  { 5: 100.0, 4: 12.0, 3: 2.0 },
  6:  { 6: 100.0, 5: 25.0, 4: 5.0, 3: 2.0 },
  7:  { 7: 100.0, 6: 50.0, 5: 10.0, 4: 2.5 },
  8:  { 8: 100.0, 7: 80.0, 6: 20.0, 5: 4.0, 4: 1.5 },
  9:  { 9: 100.0, 8: 80.0, 7: 30.0, 6: 7.0, 5: 2.5 },
  10: { 10: 100.0, 9: 80.0, 8: 30.0, 7: 8.0, 6: 3.0, 5: 1.5 },
};

type Phase = "idle" | "drawing" | "done";

export default function KenoGame() {
  const { user } = useAuth();

  const [points,       setPoints]       = useState<number | null>(null);
  const [bet,          setBet]          = useState(50);
  const [picks,        setPicks]        = useState<number[]>([]);
  const [phase,        setPhase]        = useState<Phase>("idle");
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [visibleDrawn, setVisibleDrawn] = useState<number[]>([]);
  const [matchedPicks, setMatchedPicks] = useState<number[]>([]);
  const [multiplier,   setMultiplier]   = useState(0);
  const [profit,       setProfit]       = useState(0);
  const [net,          setNet]          = useState(0);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);

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
    }, 100);
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
      setProfit(data.profit);
      setNet(data.net);
      setPhase("drawing");
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
    setProfit(0);
    setNet(0);
    setError(null);
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
          <p className="text-xs uppercase tracking-widest" style={{ color: P.brownLight }}>Saldo</p>
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
              <p className="text-xs text-center" style={{ color: P.brownLight }}>10 bolas sorteadas de 40 · Escolhe 1 a 10 números</p>
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 62px)", gap: 14, width: "fit-content" }}>
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
                      width:           62,
                      height:          62,
                      flexShrink:      0,
                      background:      c.bg,
                      border:          `2px solid ${c.border}`,
                      borderRadius:    10,
                      display:         "flex",
                      alignItems:      "center",
                      justifyContent:  "center",
                      fontSize:        "1.5rem",
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
                .sort(([a], [b]) => Number(a) - Number(b))
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
                      <span>{hits} 🎯</span>
                      <span className="text-right font-bold" style={{ color: isCurrentMatch ? "#4a8a2a" : P.goldDark }}>{mult}×</span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
