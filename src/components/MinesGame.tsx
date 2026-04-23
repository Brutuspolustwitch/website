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

  useEffect(() => { refreshPoints(); }, [refreshPoints]);

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
    if (n <= 5)  return { label: "Baixo",   color: "#22c55e" };
    if (n <= 10) return { label: "Médio",   color: "#eab308" };
    if (n <= 15) return { label: "Alto",    color: "#f97316" };
    return           { label: "Extremo",  color: "#ef4444" };
  };
  const risk = getRisk(mines);

  /* ── Not logged in ────────────────────────────────────────── */
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="text-5xl">💣</div>
        <h2 className="text-2xl font-bold font-[family-name:var(--font-display)] text-arena-gold">
          Mines
        </h2>
        <p className="text-arena-ash">Inicia sessão para jogar</p>
      </div>
    );
  }

  /* ── Checking for active game ─────────────────────────────── */
  if (checkingGame) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-arena-gold/40 border-t-arena-gold rounded-full animate-spin" />
          <p className="text-arena-ash text-sm">A verificar jogos ativos...</p>
        </div>
      </div>
    );
  }

  /* ── Stuck game recovery ──────────────────────────────────── */
  if (stuckGame) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="bg-arena-charcoal border border-arena-gold/30 rounded-xl p-8 max-w-sm w-full text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-xl font-bold font-[family-name:var(--font-display)] text-arena-gold">
            Jogo Ativo Encontrado
          </h2>
          <p className="text-arena-ash text-sm">Tens um jogo inacabado.</p>
          <div className="bg-black/30 rounded-lg p-4 space-y-2 text-sm text-left">
            <div className="flex justify-between"><span className="text-arena-ash">Aposta</span><strong className="text-arena-white">{stuckGame.bet} pts</strong></div>
            <div className="flex justify-between"><span className="text-arena-ash">Minas</span><strong className="text-arena-white">{stuckGame.mineCount} 💣</strong></div>
            <div className="flex justify-between"><span className="text-arena-ash">Células</span><strong className="text-arena-white">{stuckGame.revealedCells?.length ?? 0} 💎</strong></div>
            {stuckGame.profit > 0 && (
              <div className="flex justify-between"><span className="text-arena-ash">Valor atual</span><strong className="text-arena-gold">{stuckGame.profit} pts ({stuckGame.multiplier?.toFixed(2)}×)</strong></div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={resumeGame} className="w-full py-2.5 rounded-lg bg-arena-gold text-arena-black font-bold hover:bg-arena-gold/90 transition-colors">
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
                className="w-full py-2.5 rounded-lg bg-green-700 text-white font-bold hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                💵 Sacar ({stuckGame.profit} pts)
              </button>
            )}
            <button onClick={forfeitGame} disabled={loading} className="w-full py-2.5 rounded-lg bg-red-900/50 border border-red-500/30 text-red-300 font-bold hover:bg-red-900/80 transition-colors disabled:opacity-50">
              ✕ Desistir (perder {stuckGame.bet} pts)
            </button>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-arena-charcoal border border-arena-gold/20 rounded-xl px-6 py-4">
        <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] text-arena-gold tracking-wider">
          💣 Mines
        </h1>
        <div className="text-right">
          <p className="text-arena-ash text-xs uppercase tracking-widest">Saldo</p>
          <p className="text-arena-gold font-bold text-xl">
            {points !== null ? points.toLocaleString("pt-PT") : "—"} pts
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500/40 rounded-lg px-4 py-3 text-red-300 text-sm">
          ⚠️ {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        {/* Controls */}
        <div className="bg-arena-charcoal border border-arena-gold/20 rounded-xl p-6 h-fit space-y-5">

          {/* Idle setup */}
          {gameStatus === "idle" && (
            <>
              <div className="space-y-2">
                <label className="text-arena-gold font-semibold text-sm uppercase tracking-wider">
                  Aposta
                </label>
                <div className="flex gap-2">
                  <button onClick={() => setBet(Math.max(10, Math.floor(bet / 2)))}
                    className="px-3 py-2 rounded-lg bg-arena-gold/10 border border-arena-gold/30 text-arena-gold font-bold hover:bg-arena-gold/20 transition-colors text-sm">
                    ½
                  </button>
                  <input
                    type="number"
                    value={bet}
                    onChange={(e) => setBet(Math.min(1000, Math.max(10, parseInt(e.target.value) || 10)))}
                    className="flex-1 bg-black/40 border border-arena-steel/30 rounded-lg px-3 py-2 text-arena-white text-center focus:outline-none focus:border-arena-gold/50"
                  />
                  <button onClick={() => setBet(Math.min(1000, bet * 2))}
                    className="px-3 py-2 rounded-lg bg-arena-gold/10 border border-arena-gold/30 text-arena-gold font-bold hover:bg-arena-gold/20 transition-colors text-sm">
                    2×
                  </button>
                </div>
                <div className="flex gap-2">
                  {[25, 50, 100, 250].map((v) => (
                    <button key={v} onClick={() => setBet(v)}
                      className="flex-1 py-1.5 rounded-lg bg-arena-gold/5 border border-arena-gold/20 text-arena-ash hover:text-arena-gold hover:border-arena-gold/40 transition-colors text-xs font-medium">
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center justify-between text-arena-gold font-semibold text-sm uppercase tracking-wider">
                  <span>Minas: {mines}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: risk.color + "33", color: risk.color, border: `1px solid ${risk.color}66` }}>
                    {risk.label}
                  </span>
                </label>
                <div className="grid grid-cols-6 gap-1.5">
                  {MINE_OPTIONS.map((n) => (
                    <button key={n} onClick={() => setMines(n)}
                      className={`py-2 rounded-lg text-sm font-bold transition-colors border ${
                        mines === n
                          ? "bg-arena-gold text-arena-black border-arena-gold"
                          : "bg-black/30 text-arena-ash border-arena-steel/30 hover:border-arena-gold/40 hover:text-arena-gold"
                      }`}>
                      {n}
                    </button>
                  ))}
                </div>
                <p className="text-arena-ash text-xs">Células seguras: {GRID_SIZE - mines}</p>
              </div>

              <button
                onClick={startGame}
                disabled={loading || (points !== null && bet > points)}
                className="w-full py-3 rounded-xl bg-arena-gold text-arena-black font-bold text-lg font-[family-name:var(--font-display)] tracking-wider hover:bg-arena-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "A iniciar..." : `Iniciar Jogo (${bet} pts)`}
              </button>

              <p className="text-arena-ash/60 text-xs text-center">🎲 3% house edge</p>
            </>
          )}

          {/* Active game stats */}
          {gameStatus === "active" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/30 rounded-lg p-3 text-center">
                  <p className="text-arena-ash text-xs uppercase">Aposta</p>
                  <p className="text-arena-white font-bold">{bet} pts</p>
                </div>
                <div className="bg-black/30 rounded-lg p-3 text-center">
                  <p className="text-arena-ash text-xs uppercase">Minas</p>
                  <p className="text-red-400 font-bold">{mines} 💣</p>
                </div>
                <div className="bg-black/30 rounded-lg p-3 text-center">
                  <p className="text-arena-ash text-xs uppercase">Encontradas</p>
                  <p className="text-green-400 font-bold">{revealed.length} 💎</p>
                </div>
                <div className="bg-black/30 rounded-lg p-3 text-center">
                  <p className="text-arena-ash text-xs uppercase">Restantes</p>
                  <p className="text-arena-white font-bold">{safeCellsRemaining}</p>
                </div>
              </div>

              <div className="bg-black/40 border border-arena-gold/20 rounded-xl p-4 text-center space-y-1">
                <p className="text-arena-ash text-xs uppercase tracking-widest">Multiplicador Atual</p>
                <p className="text-arena-gold font-bold text-4xl font-[family-name:var(--font-display)]">
                  {multiplier.toFixed(2)}×
                </p>
                {nextMultiplier && (
                  <p className="text-arena-ash text-xs">Próximo: <span className="text-arena-gold">{nextMultiplier.toFixed(2)}×</span></p>
                )}
                <p className="text-green-400 font-semibold text-lg">💰 {profit} pts</p>
              </div>

              <button
                onClick={cashout}
                disabled={revealed.length === 0 || loading}
                className="w-full py-3 rounded-xl bg-green-700 text-white font-bold text-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "A processar..." : `💵 Sacar (${profit} pts)`}
              </button>

              <p className="text-red-400/70 text-xs text-center">⚠️ {mines} minas escondidas</p>
            </div>
          )}

          {/* Result */}
          {(gameStatus === "won" || gameStatus === "lost") && (
            <div className="space-y-4">
              <div className={`rounded-xl p-6 text-center border ${
                gameStatus === "won"
                  ? jackpot
                    ? "bg-yellow-900/30 border-yellow-500/50"
                    : "bg-green-900/30 border-green-500/40"
                  : "bg-red-900/30 border-red-500/40"
              }`}>
                <div className="text-5xl mb-2">
                  {jackpot ? "🏆" : gameStatus === "won" ? "🎉" : "💥"}
                </div>
                <p className={`text-2xl font-bold font-[family-name:var(--font-display)] ${
                  jackpot ? "text-yellow-400" : gameStatus === "won" ? "text-green-400" : "text-red-400"
                }`}>
                  {jackpot ? "JACKPOT!" : gameStatus === "won" ? "Ganhaste!" : "Mina!"}
                </p>
                <p className="text-4xl font-bold font-[family-name:var(--font-display)] text-arena-gold mt-1">
                  {gameStatus === "won" ? `${multiplier.toFixed(2)}×` : "0×"}
                </p>
                <p className={`text-lg font-semibold mt-1 ${gameStatus === "won" ? "text-green-400" : "text-red-400"}`}>
                  {gameStatus === "won" ? `+${profit - bet} pts lucro` : `-${bet} pts`}
                </p>
              </div>
              <button onClick={playAgain} className="w-full py-3 rounded-xl bg-arena-gold text-arena-black font-bold text-lg font-[family-name:var(--font-display)] tracking-wider hover:bg-arena-gold/90 transition-colors">
                🎮 Jogar de Novo
              </button>
            </div>
          )}
        </div>

        {/* Grid */}
        <div className="bg-arena-charcoal border border-arena-gold/20 rounded-xl p-6 flex items-start justify-center">
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
              const isRevealed  = revealed.includes(i);
              const isMine      = mineLocations.includes(i);
              const showMine    = isMine && (gameStatus === "won" || gameStatus === "lost");
              const isSafe      = isRevealed && !isMine;
              const canClick    = gameStatus === "active" && !isRevealed && !loading;

              let bg     = "rgba(30,35,50,0.95)";
              let border = "rgba(212,175,55,0.35)";
              let cursor = "default";

              if (gameStatus === "idle") { bg = "rgba(20,25,40,0.7)"; border = "rgba(212,175,55,0.15)"; }
              else if (isSafe)       { bg = "linear-gradient(135deg,rgba(16,185,129,.4),rgba(52,211,153,.3))"; border = "rgba(16,185,129,.6)"; }
              else if (showMine)     { bg = "linear-gradient(135deg,rgba(239,68,68,.5),rgba(220,38,38,.4))"; border = "rgba(239,68,68,.7)"; }
              else if (canClick)     { cursor = "pointer"; border = "rgba(212,175,55,.5)"; }

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => canClick && clickCell(i)}
                  style={{
                    aspectRatio: "1",
                    background: bg,
                    border: `2px solid ${border}`,
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "clamp(1.2rem, 3vw, 1.8rem)",
                    cursor,
                    transition: "all 0.15s",
                  }}
                >
                  {(gameStatus === "idle" || (gameStatus === "active" && !isRevealed)) && "❓"}
                  {isSafe && "💎"}
                  {showMine && "💣"}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
