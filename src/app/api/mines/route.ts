import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

const GRID_SIZE = 25;
const MIN_MINES = 5;
const MAX_MINES = 24;
const HOUSE_EDGE = 0.03;

const SE_API = "https://api.streamelements.com/kappa/v2";

/* ── Auth helper ──────────────────────────────────────────────── */
function parseSession(raw: string): { id: string; login: string } | null {
  try { return JSON.parse(raw); } catch { return null; }
}

async function getAuthUser() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("twitch_session")?.value;
  if (!raw) return null;
  const session = parseSession(raw);
  if (!session) return null;
  const { data: user } = await supabase
    .from("users")
    .select("id, login, se_username")
    .eq("twitch_id", session.id)
    .single();
  return user ?? null;
}

/* ── SE Points helper ─────────────────────────────────────────── */
async function updateSEPoints(username: string, amount: number): Promise<boolean> {
  const token = process.env.STREAMELEMENTS_JWT_TOKEN;
  const channelId = process.env.STREAMELEMENTS_CHANNEL_ID;
  if (!token || !channelId) return false;

  const absAmount = Math.abs(amount);
  const method = amount < 0 ? "DELETE" : "PUT";
  try {
    const res = await fetch(
      `${SE_API}/points/${channelId}/${encodeURIComponent(username)}/${absAmount}`,
      { method, headers: { Accept: "application/json", Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`SE points ${method} failed: ${res.status}`, detail);
      return false;
    }
    return true;
  } catch (err) {
    console.error("SE points error:", err);
    return false;
  }
}

/* ── Multiplier formula ───────────────────────────────────────── */
function calcMultiplier(revealedCount: number, mineCount: number): number {
  if (revealedCount === 0) return 1.0;
  const safeCells = GRID_SIZE - mineCount;
  let mult = 1.0;
  for (let i = 0; i < revealedCount; i++) {
    const remainingTotal = GRID_SIZE - i;
    const remainingSafe = safeCells - i;
    mult *= remainingTotal / remainingSafe;
  }
  mult *= 1 - HOUSE_EDGE;
  if (mineCount <= 5) mult *= 0.90;
  else if (mineCount <= 7) mult *= 0.95;
  return Math.round(mult * 100) / 100;
}

/* ── Mine position generation ─────────────────────────────────── */
function generateMinePositions(mineCount: number): number[] {
  const available = Array.from({ length: GRID_SIZE }, (_, i) => i);
  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [available[i], available[j]] = [available[j], available[i]];
  }
  return available.slice(0, mineCount);
}

/* ── Actions ──────────────────────────────────────────────────── */
async function handleStart(user: { id: string; login: string; se_username: string | null }, body: Record<string, unknown>) {
  const bet = Number(body.bet);
  const mineCount = Number(body.mineCount);

  if (!bet || bet < 10 || bet > 1000) {
    return NextResponse.json({ error: "Aposta inválida (10–1000)" }, { status: 400 });
  }
  if (!mineCount || mineCount < MIN_MINES || mineCount > MAX_MINES) {
    return NextResponse.json({ error: `Número de minas inválido (${MIN_MINES}–${MAX_MINES})` }, { status: 400 });
  }

  // Block if active game exists
  const { data: existing } = await supabase
    .from("mines_games")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();
  if (existing) {
    return NextResponse.json({ error: "Já tens um jogo ativo", gameId: existing.id }, { status: 400 });
  }

  // Deduct bet via SE
  const seUser = user.se_username || user.login;
  const deducted = await updateSEPoints(seUser, -bet);
  if (!deducted) {
    return NextResponse.json({ error: "Falha ao deduzir pontos. Verifica o teu saldo." }, { status: 502 });
  }

  const minePositions = generateMinePositions(mineCount);
  const maxSafeCells = GRID_SIZE - mineCount;
  const maxMultiplier = calcMultiplier(maxSafeCells, mineCount);

  const { data: game, error } = await supabase
    .from("mines_games")
    .insert({
      user_id: user.id,
      bet_amount: bet,
      mine_count: mineCount,
      mine_positions: minePositions,
      revealed_cells: [],
      multiplier: 1.0,
      status: "active",
    })
    .select("id, bet_amount, mine_count, multiplier, status")
    .single();

  if (error || !game) {
    // Refund on DB error
    await updateSEPoints(seUser, bet);
    console.error("Create mines_game error:", error);
    return NextResponse.json({ error: "Erro ao criar jogo" }, { status: 500 });
  }

  const nextMultipliers: number[] = [];
  for (let i = 1; i <= Math.min(5, maxSafeCells); i++) {
    nextMultipliers.push(calcMultiplier(i, mineCount));
  }

  return NextResponse.json({
    success: true,
    game: {
      id: game.id,
      bet: game.bet_amount,
      mineCount: game.mine_count,
      multiplier: game.multiplier,
      revealedCells: [],
      status: game.status,
      safeCellsRemaining: maxSafeCells,
      maxMultiplier,
      nextMultipliers,
    },
  });
}

async function handleReveal(userId: string, body: Record<string, unknown>) {
  const { gameId, cellIndex } = body as { gameId: string; cellIndex: number };

  if (cellIndex === undefined || cellIndex < 0 || cellIndex >= GRID_SIZE) {
    return NextResponse.json({ error: "Célula inválida" }, { status: 400 });
  }

  const { data: game, error } = await supabase
    .from("mines_games")
    .select("*")
    .eq("id", gameId)
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (error || !game) {
    return NextResponse.json({ error: "Jogo ativo não encontrado" }, { status: 404 });
  }

  const revealedCells: number[] = game.revealed_cells ?? [];
  if (revealedCells.includes(cellIndex)) {
    return NextResponse.json({ error: "Célula já revelada" }, { status: 400 });
  }

  const minePositions: number[] = game.mine_positions ?? [];
  const newRevealedCells = [...revealedCells, cellIndex];
  const isMine = minePositions.includes(cellIndex);

  if (isMine) {
    await supabase
      .from("mines_games")
      .update({ revealed_cells: newRevealedCells, status: "lost", result_amount: 0, ended_at: new Date().toISOString() })
      .eq("id", gameId);

    return NextResponse.json({
      success: true, result: "mine", gameOver: true, won: false,
      minePositions, revealedCells: newRevealedCells,
    });
  }

  const safeCells = GRID_SIZE - game.mine_count;
  const safeCellsRemaining = safeCells - newRevealedCells.length;
  const newMultiplier = calcMultiplier(newRevealedCells.length, game.mine_count);
  const newProfit = Math.floor(game.bet_amount * newMultiplier);
  const nextMultiplier = safeCellsRemaining > 0
    ? calcMultiplier(newRevealedCells.length + 1, game.mine_count)
    : null;
  const allSafeFound = newRevealedCells.length === safeCells;

  if (allSafeFound) {
    await supabase
      .from("mines_games")
      .update({ revealed_cells: newRevealedCells, multiplier: newMultiplier, status: "won", result_amount: newProfit, ended_at: new Date().toISOString() })
      .eq("id", gameId);

    // Credit winnings
    const { data: dbUser } = await supabase.from("users").select("login, se_username").eq("id", userId).single();
    const seUser = dbUser?.se_username || dbUser?.login || "";
    await updateSEPoints(seUser, newProfit);

    return NextResponse.json({
      success: true, result: "safe", gameOver: true, won: true, jackpot: true,
      multiplier: newMultiplier, profit: newProfit, minePositions,
      revealedCells: newRevealedCells, safeCellsRemaining: 0,
    });
  }

  await supabase
    .from("mines_games")
    .update({ revealed_cells: newRevealedCells, multiplier: newMultiplier })
    .eq("id", gameId);

  return NextResponse.json({
    success: true, result: "safe", gameOver: false,
    multiplier: newMultiplier, nextMultiplier, profit: newProfit,
    revealedCells: newRevealedCells, safeCellsRemaining,
  });
}

async function handleCashout(userId: string, body: Record<string, unknown>) {
  const { gameId } = body as { gameId: string };

  const { data: game, error } = await supabase
    .from("mines_games")
    .select("*")
    .eq("id", gameId)
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (error || !game) {
    return NextResponse.json({ error: "Jogo ativo não encontrado" }, { status: 404 });
  }

  const revealedCells: number[] = game.revealed_cells ?? [];
  if (revealedCells.length === 0) {
    return NextResponse.json({ error: "Revela pelo menos uma célula antes de sacar" }, { status: 400 });
  }

  const currentMultiplier = calcMultiplier(revealedCells.length, game.mine_count);
  const profit = Math.floor(game.bet_amount * currentMultiplier);

  await supabase
    .from("mines_games")
    .update({ status: "won", multiplier: currentMultiplier, result_amount: profit, ended_at: new Date().toISOString() })
    .eq("id", gameId);

  const { data: dbUser } = await supabase.from("users").select("login, se_username").eq("id", userId).single();
  const seUser = dbUser?.se_username || dbUser?.login || "";
  await updateSEPoints(seUser, profit);

  return NextResponse.json({
    success: true, won: true, profit, multiplier: currentMultiplier,
    minePositions: game.mine_positions, revealedCells,
  });
}

async function handleForfeit(userId: string) {
  const { data: game, error } = await supabase
    .from("mines_games")
    .select("id, bet_amount")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (error || !game) {
    return NextResponse.json({ error: "Nenhum jogo ativo encontrado" }, { status: 404 });
  }

  await supabase
    .from("mines_games")
    .update({ status: "forfeited", result_amount: 0, ended_at: new Date().toISOString() })
    .eq("id", game.id);

  return NextResponse.json({ success: true, betLost: game.bet_amount });
}

async function handleGetActiveGame(userId: string) {
  const { data: game } = await supabase
    .from("mines_games")
    .select("id, bet_amount, mine_count, revealed_cells, multiplier, created_at")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (!game) {
    return NextResponse.json({ success: true, hasActiveGame: false });
  }

  const revealedCells: number[] = game.revealed_cells ?? [];
  const safeCells = GRID_SIZE - game.mine_count;
  const safeCellsRemaining = safeCells - revealedCells.length;
  const currentMultiplier = calcMultiplier(revealedCells.length, game.mine_count);
  const profit = Math.floor(game.bet_amount * currentMultiplier);

  return NextResponse.json({
    success: true,
    hasActiveGame: true,
    game: {
      id: game.id,
      bet: game.bet_amount,
      mineCount: game.mine_count,
      revealedCells,
      multiplier: currentMultiplier,
      profit,
      safeCellsRemaining,
    },
  });
}

/* ── Main handler ─────────────────────────────────────────────── */
export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido" }, { status: 400 });
  }

  const { action, ...params } = body as { action: string } & Record<string, unknown>;

  try {
    switch (action) {
      case "start":        return await handleStart(user, params);
      case "reveal":       return await handleReveal(user.id, params);
      case "cashout":      return await handleCashout(user.id, params);
      case "forfeit":      return await handleForfeit(user.id);
      case "getActiveGame": return await handleGetActiveGame(user.id);
      default:             return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
    }
  } catch (err) {
    console.error("Mines API error:", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
