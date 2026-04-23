"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";

const GRID_SIZE = 25;
const MINE_OPTIONS = [5, 7, 10, 15, 20, 24];

interface ActiveGame {
  id: string;
  bet: number;
  mineCount: number;
  revealedCells: number[];
  multiplier: number;
  profit: number;
  safeCellsRemaining: number;
}

type GameStatus = "idle" | "active" | "won" | "lost";

export default function MinesGame() {
  const { user } = useAuth();

  const [points, setPoints]       = useState<number | null>(null);
  const [bet, setBet]             = useState(50);
  const [mines, setMines]         = useState(5);

  const [gameId, setGameId]         = useState<string | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus>("idle");
  const [revealed, setRevealed]     = useState<number[]>([]);
  const [mineLocations, setMineLocations] = useState<number[]>([]);
  const [multiplier, setMultiplier] = useState(1.0);
  const [nextMultiplier, setNextMultiplier] = useState<number | null>(null);
  const [profit, setProfit]         = useState(0);
  const [safeCellsRemaining, setSafeCellsRemaining] = useState(0);
  const [jackpot, setJackpot]       = useState(false);

  const [loading, setLoading]             = useState(false);
  const [checkingGame, setCheckingGame]   = useState(true);
  const [stuckGame, setStuckGame]         = useState<ActiveGame | null>(null);
  const [error, setError]                 = useState<string | null>(null);

  /* ── Fetch SE points ──────────────────────────────────────── */
  const refreshPoints = useCallback(() => {
    if (!user) return;
    const username = encodeURIComponent(user.login);
    fetch(`/api/streamelements?endpoint=user-points&username=${username}`)
      .then((r) => r.json())
      .then((d) => { if (typeof d.points === "number") setPoints(d.points); })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    refreshPoints();
    const interval = setInterval(refreshPoints, 15000);
    return () => clearInterval(interval);
  }, [refreshPoints]);

  /* ── Check for active game on mount ──────────────────────── */
  useEffect(() => {
    if (!user) { setCheckingGame(false); return; }
    fetch("/api/mines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getActiveGame" }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.hasActiveGame) setStuckGame(d.game);
      })
      .catch(() => {})
      .finally(() => setCheckingGame(false));
  }, [user]);

  /* ── API call helper ──────────────────────────────────────── */
  const apiCall = async (action: string, params: Record<string, unknown> = {}) => {
    const res = await fetch("/api/mines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...params }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro de API");
    return data;
  };

  /* ── Resume stuck game ────────────────────────────────────── */
  const resumeGame = () => {
    if (!stuckGame) return;
    setGameId(stuckGame.id);
    setBet(stuckGame.bet);
    setMines(stuckGame.mineCount);
    setRevealed(stuckGame.revealedCells ?? []);
    setMultiplier(stuckGame.multiplier ?? 1.0);
    setProfit(stuckGame.profit ?? 0);
    setSafeCellsRemaining(stuckGame.safeCellsRemaining);
    setGameStatus("active");
    setStuckGame(null);
    setError(null);
  };

  /* ── Forfeit stuck game ───────────────────────────────────── */
  const forfeitGame = async () => {
    if (!stuckGame) return;
    setLoading(true);
    try {
      await apiCall("forfeit");
      setStuckGame(null);
      refreshPoints();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  /* ── Start new game ───────────────────────────────────────── */
  const startGame = async () => {
    if (!user) return;
    setError(null);
    setLoading(true);
    try {
      const data = await apiCall("start", { bet, mineCount: mines });
      if (data.success) {
        setGameId(data.game.id);
        setRevealed([]);
        setMineLocations([]);
        setMultiplier(1.0);
        setNextMultiplier(data.game.nextMultipliers?.[0] ?? null);
        setProfit(0);
        setSafeCellsRemaining(data.game.safeCellsRemaining);
        setGameStatus("active");
        setJackpot(false);
        refreshPoints();
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  /* ── Click cell ───────────────────────────────────────────── */
  const clickCell = async (cellIndex: number) => {
    if (gameStatus !== "active" || revealed.includes(cellIndex) || loading) return;
    setLoading(true);
    try {
      const data = await apiCall("reveal", { gameId, cellIndex });
      if (data.success) {
        setRevealed(data.revealedCells);
        if (data.result === "mine") {
          setMineLocations(data.minePositions);
          setGameStatus("lost");
        } else if (data.gameOver && data.won) {
          setMineLocations(data.minePositions);
          setMultiplier(data.multiplier);
          setProfit(data.profit);
          setJackpot(data.jackpot ?? false);
          setGameStatus("won");
          setSafeCellsRemaining(0);
          refreshPoints();
        } else {
          setMultiplier(data.multiplier);
          setNextMultiplier(data.nextMultiplier);
          setProfit(data.profit);
          setSafeCellsRemaining(data.safeCellsRemaining);
        }
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  /* ── Cash out ─────────────────────────────────────────────── */
  const cashout = async () => {
    if (gameStatus !== "active" || revealed.length === 0 || loading) return;
    setLoading(true);
    try {
      const data = await apiCall("cashout", { gameId });
      if (data.success) {
        setMineLocations(data.minePositions);
        setProfit(data.profit);
        setMultiplier(data.multiplier);
        setGameStatus("won");
        refreshPoints();
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  /* ── Play again ───────────────────────────────────────────── */
  const playAgain = () => {
    setGameId(null);
    setGameStatus("idle");
    setRevealed([]);
    setMineLocations([]);
    setMultiplier(1.0);
    setNextMultiplier(null);
    setProfit(0);
    setJackpot(false);
    setSafeCellsRemaining(0);
    setError(null);
  };

  const getRisk = (n: number) => {
    if (n <= 5)  return { label: "Baixo",   color: "#5a8a3c" };
    if (n <= 10) return { label: "Médio",   color: "#b8860b" };
    if (n <= 15) return { label: "Alto",    color: "#c0522a" };
    return           { label: "Extremo",  color: "#8b1a1a" };
  };
  const risk = getRisk(mines);

  // Papyrus palette
  const P = {
    parchment:    "#f5e6c8",
    parchmentMid: "#e8d4a8",
    parchmentDeep:"#d4be8a",
    parchmentDark:"#c4a86a",
    brown:        "#2c1b0e",
    brownMid:     "#5c3a1e",
    brownLight:   "#8b5e3c",
    gold:         "#c9a227",
    goldLight:    "#e8c547",
    goldDark:     "#9a7a1a",
    panel:        "#ede0c0",
    border:       "#b8952a",
    borderLight:  "#d4b45a",
  };

  /* ── Not logged in ────────────────────────────────────────── */
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4"
        style={{ background: P.parchment, borderRadius: 16, padding: 32 }}>
        <div className="text-5xl">💣</div>
        <h2 className="text-2xl font-bold font-[family-name:var(--font-display)]"
          style={{ color: P.brown }}>
          Mines
        </h2>
        <p style={{ color: P.brownLight }}>Inicia sessão para jogar</p>
      </div>
    );
  }

  /* ── Checking for active game ─────────────────────────────── */
  if (checkingGame) {
    return (
      <div className="flex items-center justify-center min-h-[400px]"
        style={{ background: P.parchment, borderRadius: 16 }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: P.gold, borderTopColor: "transparent" }} />
          <p style={{ color: P.brownLight }} className="text-sm">A verificar jogos ativos...</p>
        </div>
      </div>
    );
  }

  const goldBtn = {
    background: `linear-gradient(180deg, ${P.goldLight} 0%, ${P.gold} 50%, ${P.goldDark} 100%)`,
    color: P.brown,
    border: `2px solid ${P.goldDark}`,
    boxShadow: `0 2px 8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,220,0.4)`,
    fontFamily: "var(--font-display)",
    letterSpacing: "0.06em",
    fontWeight: 700,
    cursor: "pointer",
    transition: "filter 0.15s",
  } as React.CSSProperties;

  const panelStyle = {
    background: P.panel,
    border: `2px solid ${P.border}`,
    borderRadius: 12,
  } as React.CSSProperties;

  /* ── Stuck game recovery ──────────────────────────────────── */
  if (stuckGame) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div style={{ ...panelStyle, maxWidth: 360, width: "100%", padding: 32, textAlign: "center" }} className="space-y-4">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-xl font-bold font-[family-name:var(--font-display)]"
            style={{ color: P.brown }}>Jogo Ativo Encontrado</h2>
          <p style={{ color: P.brownLight }} className="text-sm">Tens um jogo inacabado.</p>
          <div className="space-y-2 text-sm text-left rounded-lg p-4"
            style={{ background: P.parchmentDeep, border: `1px solid ${P.borderLight}` }}>
            {[
              ["Aposta", `${stuckGame.bet} pts`],
              ["Minas",  `${stuckGame.mineCount} 💣`],
              ["Células",`${stuckGame.revealedCells?.length ?? 0} 💎`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span style={{ color: P.brownLight }}>{k}</span>
                <strong style={{ color: P.brown }}>{v}</strong>
              </div>
            ))}
            {stuckGame.profit > 0 && (
              <div className="flex justify-between">
                <span style={{ color: P.brownLight }}>Valor atual</span>
                <strong style={{ color: P.goldDark }}>{stuckGame.profit} pts ({stuckGame.multiplier?.toFixed(2)}×)</strong>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={resumeGame} style={{ ...goldBtn, padding: "10px 0", borderRadius: 8, width: "100%" }}>
              ▶ Retomar Jogo
            </button>
            {stuckGame.revealedCells?.length > 0 && stuckGame.profit > 0 && (
              <button
                onClick={async () => {
                  setLoading(true);
                  try {
                    const data = await apiCall("cashout", { gameId: stuckGame.id });
                    if (data.success) { setStuckGame(null); refreshPoints(); }
                  } catch (err) { setError((err as Error).message); }
                  finally { setLoading(false); }
                }}
                disabled={loading}
                style={{ padding: "10px 0", borderRadius: 8, width: "100%", background: "#3a6b2a", color: "#e8f5e0", border: "1px solid #2a5020", fontWeight: 700, cursor: "pointer", opacity: loading ? 0.5 : 1 }}
              >
                💵 Sacar ({stuckGame.profit} pts)
              </button>
            )}
            <button onClick={forfeitGame} disabled={loading}
              style={{ padding: "10px 0", borderRadius: 8, width: "100%", background: "#6b2a2a", color: "#f5dada", border: "1px solid #501a1a", fontWeight: 700, cursor: "pointer", opacity: loading ? 0.5 : 1 }}>
              ✕ Desistir (perder {stuckGame.bet} pts)
            </button>
          </div>
          {error && <p className="text-sm" style={{ color: "#8b1a1a" }}>{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 rounded-xl"
        style={{ background: `linear-gradient(135deg, ${P.parchmentDeep} 0%, ${P.parchmentMid} 100%)`, border: `2px solid ${P.border}`, boxShadow: "0 4px 16px rgba(0,0,0,0.25)" }}>
        <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] tracking-wider"
          style={{ color: P.brown, textShadow: `0 1px 0 rgba(255,255,200,0.5)` }}>
          💣 Mines
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

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        {/* Controls */}
        <div style={{ ...panelStyle, padding: 24 }} className="h-fit space-y-5">

          {/* Idle setup */}
          {gameStatus === "idle" && (
            <>
              <div className="space-y-2">
                <label className="block text-sm uppercase tracking-wider font-semibold"
                  style={{ color: P.brownMid }}>Aposta</label>
                <div className="flex gap-2">
                  <button onClick={() => setBet(Math.max(10, Math.floor(bet / 2)))}
                    style={{ ...goldBtn, padding: "8px 12px", borderRadius: 8, fontSize: 14 }}>½</button>
                  <input
                    type="number"
                    value={bet}
                    onChange={(e) => setBet(Math.min(1000, Math.max(10, parseInt(e.target.value) || 10)))}
                    className="flex-1 text-center focus:outline-none"
                    style={{ background: P.parchment, border: `1px solid ${P.borderLight}`, borderRadius: 8, padding: "8px 12px", color: P.brown, fontWeight: 700 }}
                  />
                  <button onClick={() => setBet(Math.min(1000, bet * 2))}
                    style={{ ...goldBtn, padding: "8px 12px", borderRadius: 8, fontSize: 14 }}>2×</button>
                </div>
                <div className="flex gap-2">
                  {[25, 50, 100, 250].map((v) => (
                    <button key={v} onClick={() => setBet(v)}
                      className="flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors"
                      style={{ background: P.parchmentDeep, border: `1px solid ${P.borderLight}`, color: P.brownMid }}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center justify-between text-sm uppercase tracking-wider font-semibold"
                  style={{ color: P.brownMid }}>
                  <span>Minas: {mines}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                    style={{ backgroundColor: risk.color + "22", color: risk.color, border: `1px solid ${risk.color}88` }}>
                    {risk.label}
                  </span>
                </label>
                <div className="grid grid-cols-6 gap-1.5">
                  {MINE_OPTIONS.map((n) => (
                    <button key={n} onClick={() => setMines(n)}
                      className="py-2 text-sm font-bold rounded-lg transition-colors"
                      style={mines === n
                        ? { ...goldBtn, padding: "8px 4px" }
                        : { background: P.parchmentDeep, border: `1px solid ${P.borderLight}`, color: P.brownMid, cursor: "pointer" }
                      }>
                      {n}
                    </button>
                  ))}
                </div>
                <p className="text-xs" style={{ color: P.brownLight }}>Células seguras: {GRID_SIZE - mines}</p>
              </div>

              <button
                onClick={startGame}
                disabled={loading || (points !== null && bet > points)}
                style={{ ...goldBtn, width: "100%", padding: "14px 0", borderRadius: 12, fontSize: 18, opacity: (loading || (points !== null && bet > points)) ? 0.5 : 1 }}
              >
                {loading ? "A iniciar..." : `Iniciar Jogo (${bet} pts)`}
              </button>

              <p className="text-xs text-center" style={{ color: P.brownLight }}>🎲 3% house edge</p>
            </>
          )}

          {/* Active game stats */}
          {gameStatus === "active" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Aposta",     `${bet} pts`,           P.brown],
                  ["Minas",      `${mines} 💣`,           "#8b1a1a"],
                  ["Encontradas",`${revealed.length} 💎`, "#3a6b2a"],
                  ["Restantes",  `${safeCellsRemaining}`, P.brownMid],
                ].map(([label, val, col]) => (
                  <div key={label as string} className="rounded-lg p-3 text-center"
                    style={{ background: P.parchmentDeep, border: `1px solid ${P.borderLight}` }}>
                    <p className="text-xs uppercase mb-0.5" style={{ color: P.brownLight }}>{label}</p>
                    <p className="font-bold" style={{ color: col as string }}>{val}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl p-4 text-center space-y-1"
                style={{ background: P.parchmentMid, border: `2px solid ${P.border}` }}>
                <p className="text-xs uppercase tracking-widest" style={{ color: P.brownLight }}>Multiplicador Atual</p>
                <p className="font-bold text-4xl font-[family-name:var(--font-display)]"
                  style={{ color: P.goldDark }}>{multiplier.toFixed(2)}×</p>
                {nextMultiplier && (
                  <p className="text-xs" style={{ color: P.brownLight }}>
                    Próximo: <span style={{ color: P.goldDark }}>{nextMultiplier.toFixed(2)}×</span>
                  </p>
                )}
                <p className="font-semibold text-lg" style={{ color: "#3a6b2a" }}>💰 {profit} pts</p>
              </div>

              <button
                onClick={cashout}
                disabled={revealed.length === 0 || loading}
                style={{ width: "100%", padding: "12px 0", borderRadius: 12, background: "#3a6b2a", color: "#e8f5e0", border: "2px solid #2a5020", fontWeight: 700, fontSize: 17, cursor: "pointer", opacity: (revealed.length === 0 || loading) ? 0.5 : 1, boxShadow: "0 2px 8px rgba(0,0,0,0.3)", transition: "filter 0.15s" }}
              >
                {loading ? "A processar..." : `💵 Sacar (${profit} pts)`}
              </button>

              <p className="text-xs text-center" style={{ color: "#8b1a1a99" }}>⚠️ {mines} minas escondidas</p>
            </div>
          )}

          {/* Result */}
          {(gameStatus === "won" || gameStatus === "lost") && (
            <div className="space-y-4">
              <div className="rounded-xl p-6 text-center"
                style={gameStatus === "won"
                  ? jackpot
                    ? { background: "#6b5000aa", border: "2px solid #c9a227" }
                    : { background: "#2a4a1a88", border: "2px solid #4a8a2a" }
                  : { background: "#4a1a1a88", border: "2px solid #8b2a2a" }
                }>
                <div className="text-5xl mb-2">
                  {jackpot ? "🏆" : gameStatus === "won" ? "🎉" : "💥"}
                </div>
                <p className="text-2xl font-bold font-[family-name:var(--font-display)]"
                  style={{ color: jackpot ? P.gold : gameStatus === "won" ? "#6abf4b" : "#d45050" }}>
                  {jackpot ? "JACKPOT!" : gameStatus === "won" ? "Ganhaste!" : "Mina!"}
                </p>
                <p className="text-4xl font-bold font-[family-name:var(--font-display)] mt-1"
                  style={{ color: P.gold }}>
                  {gameStatus === "won" ? `${multiplier.toFixed(2)}×` : "0×"}
                </p>
                <p className="text-lg font-semibold mt-1"
                  style={{ color: gameStatus === "won" ? "#6abf4b" : "#d45050" }}>
                  {gameStatus === "won" ? `+${profit - bet} pts lucro` : `-${bet} pts`}
                </p>
              </div>
              <button onClick={playAgain}
                style={{ ...goldBtn, width: "100%", padding: "14px 0", borderRadius: 12, fontSize: 18 }}>
                🎮 Jogar de Novo
              </button>
            </div>
          )}
        </div>

        {/* Grid */}
        <div className="flex items-start justify-center rounded-xl p-6"
          style={{ background: `linear-gradient(135deg, ${P.parchmentMid} 0%, ${P.parchment} 100%)`, border: `2px solid ${P.border}` }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
              gap: "8px",
              width: "100%",
              maxWidth: "430px",
            }}
          >
            {Array.from({ length: GRID_SIZE }, (_, i) => {
              const isRevealed = revealed.includes(i);
              const isMine     = mineLocations.includes(i);
              const showMine   = isMine && (gameStatus === "won" || gameStatus === "lost");
              const isSafe     = isRevealed && !isMine;
              const canClick   = gameStatus === "active" && !isRevealed && !loading;

              let bg     = `linear-gradient(135deg, ${P.parchmentDeep} 0%, ${P.parchmentDark} 100%)`;
              let border = P.border;
              let shadow = "0 2px 4px rgba(0,0,0,0.2)";
              let cursor = "default";

              if (gameStatus === "idle") {
                bg = P.parchmentDeep; border = P.borderLight; shadow = "none";
              } else if (isSafe) {
                bg = "linear-gradient(135deg,#4a8a2a,#6abf4b)"; border = "#3a7a1a"; shadow = "0 0 8px rgba(100,200,60,0.4)";
              } else if (showMine) {
                bg = "linear-gradient(135deg,#8b2a2a,#c04040)"; border = "#6a1a1a"; shadow = "0 0 8px rgba(200,40,40,0.4)";
              } else if (canClick) {
                cursor = "pointer"; border = P.goldDark;
              }

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => canClick && clickCell(i)}
                  style={{
                    aspectRatio: "1",
                    background: bg,
                    border: `2px solid ${border}`,
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor,
                    transition: "all 0.15s",
                    boxShadow: shadow,
                    padding: "10%",
                  }}
                >
                  {(gameStatus === "idle" || (gameStatus === "active" && !isRevealed)) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src="/images/mines/questionmark2.png" alt="?" style={{ width: "70%", height: "70%", objectFit: "contain" }} />
                  )}
                  {isSafe && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src="/images/mines/diamond.png" alt="💎" style={{ width: "70%", height: "70%", objectFit: "contain" }} />
                  )}
                  {showMine && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src="/images/mines/bomb.jpg" alt="💣" style={{ width: "70%", height: "70%", objectFit: "contain", mixBlendMode: "multiply" }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
