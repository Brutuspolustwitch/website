import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Service-role client — bypasses RLS; safe for server-only API routes.
// Placeholder fallback prevents build-time crash (same pattern as supabase.ts).
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL    || "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY   || "placeholder"
);

const GRID_SIZE  = 40;   // total numbers in the pool
const DRAW_COUNT = 10;   // numbers drawn per round
const SE_API     = "https://api.streamelements.com/kappa/v2";

/* ── Payout table: PAYOUTS[spots][hits] = multiplier ─────────────── */
const PAYOUTS: Record<number, Record<number, number>> = {
  1:  { 1: 3 },
  2:  { 2: 8,    1: 1 },
  3:  { 3: 20,   2: 2 },
  4:  { 4: 30,   3: 5,   2: 1 },
  5:  { 5: 50,   4: 10,  3: 2 },
  6:  { 6: 60,   5: 20,  4: 4,   3: 1 },
  7:  { 7: 70,   6: 25,  5: 8,   4: 2 },
  8:  { 8: 80,   7: 40,  6: 15,  5: 4,   4: 1 },
  9:  { 9: 90,   8: 50,  7: 20,  6: 6,   5: 2 },
  10: { 10: 100, 9: 80,  8: 50,  7: 30,  6: 10, 5: 5, 4: 2 },
};

/* ═══════════════════════════════════════════════════════════════
   AUTH
   ═══════════════════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════════════════
   STREAMELEMENTS POINTS
   ═══════════════════════════════════════════════════════════════ */
async function updateSEPoints(username: string, amount: number): Promise<boolean> {
  const token     = process.env.STREAMELEMENTS_JWT_TOKEN;
  const channelId = process.env.STREAMELEMENTS_CHANNEL_ID;
  if (!token || !channelId) return false;
  try {
    const res = await fetch(
      `${SE_API}/points/${channelId}/${encodeURIComponent(username)}/${amount}`,
      { method: "PUT", headers: { Accept: "application/json", Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) {
      console.error(`SE points PUT failed: ${res.status}`, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (err) {
    console.error("SE points error:", err);
    return false;
  }
}

/* ═══════════════════════════════════════════════════════════════
   PROVABLY FAIR RNG
   ═══════════════════════════════════════════════════════════════ */
function generateServerSeed(): string {
  return crypto.randomBytes(32).toString("hex");
}

function hashSeed(seed: string): string {
  return crypto.createHash("sha256").update(seed).digest("hex");
}

/**
 * Deterministic Fisher-Yates shuffle of [1..GRID_SIZE] driven by
 * chained HMAC-SHA256(serverSeed, clientSeed:nonce:counter).
 * Returns the first DRAW_COUNT values as the drawn numbers.
 */
function generateDraw(serverSeed: string, clientSeed: string, nonce: number): number[] {
  // Each HMAC round → 32 bytes. Fisher-Yates on 40 elements needs
  // 39 iterations × 4 bytes = 156 bytes → 5 rounds = 160 bytes.
  const bytes: number[] = [];
  for (let counter = 0; bytes.length < (GRID_SIZE - 1) * 4; counter++) {
    const hmac = crypto
      .createHmac("sha256", serverSeed)
      .update(`${clientSeed}:${nonce}:${counter}`)
      .digest();
    bytes.push(...Array.from(hmac));
  }

  const pool = Array.from({ length: GRID_SIZE }, (_, i) => i + 1);
  let idx = 0;

  for (let i = pool.length - 1; i > 0; i--) {
    // Build unsigned 32-bit integer from 4 bytes
    // Use multiplication for the MSB to avoid signed left-shift at bit 31
    const val = (bytes[idx] * 0x1000000 + (bytes[idx + 1] << 16) + (bytes[idx + 2] << 8) + bytes[idx + 3]) >>> 0;
    idx += 4;
    const j = val % (i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, DRAW_COUNT);
}

function getMultiplier(spots: number, hits: number): number {
  return PAYOUTS[spots]?.[hits] ?? 0;
}

/* ═══════════════════════════════════════════════════════════════
   SEED MANAGEMENT
   ═══════════════════════════════════════════════════════════════ */
type SeedRow = { id: string; server_seed: string; server_seed_hash: string; client_seed: string; nonce: number };

async function getOrCreateActiveSeed(userId: string): Promise<SeedRow | null> {
  const { data: existing } = await supabase
    .from("keno_seeds")
    .select("id, server_seed, server_seed_hash, client_seed, nonce")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (existing) return existing as SeedRow;

  const serverSeed     = generateServerSeed();
  const serverSeedHash = hashSeed(serverSeed);
  const { data: created } = await supabase
    .from("keno_seeds")
    .insert({ user_id: userId, server_seed: serverSeed, server_seed_hash: serverSeedHash, client_seed: "default", nonce: 0, is_active: true })
    .select("id, server_seed, server_seed_hash, client_seed, nonce")
    .single();

  return (created as SeedRow) ?? null;
}

/* ═══════════════════════════════════════════════════════════════
   ACTION HANDLERS
   ═══════════════════════════════════════════════════════════════ */
async function handlePlay(
  user: { id: string; login: string; se_username: string | null },
  body: Record<string, unknown>
) {
  const bet   = Number(body.bet);
  const picks = body.picks as number[];

  if (!bet || bet < 10 || bet > 1000)
    return NextResponse.json({ error: "Aposta inválida (10–1000)" }, { status: 400 });
  if (!Array.isArray(picks) || picks.length < 1 || picks.length > 10)
    return NextResponse.json({ error: "Seleciona entre 1 e 10 números" }, { status: 400 });
  if (picks.some((n) => !Number.isInteger(n) || n < 1 || n > GRID_SIZE))
    return NextResponse.json({ error: "Números inválidos" }, { status: 400 });
  if (new Set(picks).size !== picks.length)
    return NextResponse.json({ error: "Números duplicados" }, { status: 400 });

  const seed = await getOrCreateActiveSeed(user.id);
  if (!seed) return NextResponse.json({ error: "Erro de seed" }, { status: 500 });

  const seUser   = user.se_username || user.login;
  const deducted = await updateSEPoints(seUser, -bet);
  if (!deducted)
    return NextResponse.json({ error: "Falha ao deduzir pontos. Verifica o teu saldo." }, { status: 502 });

  const drawnNumbers = generateDraw(seed.server_seed, seed.client_seed, seed.nonce);
  const drawnSet     = new Set(drawnNumbers);
  const matchedPicks = picks.filter((n) => drawnSet.has(n));
  const matches      = matchedPicks.length;
  const multiplier   = getMultiplier(picks.length, matches);
  const resultAmount = Math.floor(bet * multiplier);

  if (resultAmount > 0) await updateSEPoints(seUser, resultAmount);

  // Increment nonce for next round
  await supabase.from("keno_seeds").update({ nonce: seed.nonce + 1 }).eq("id", seed.id);

  const { error: dbErr } = await supabase.from("keno_games").insert({
    user_id:          user.id,
    bet_amount:       bet,
    picks,
    spots:            picks.length,
    drawn_numbers:    drawnNumbers,
    matches,
    multiplier,
    result_amount:    resultAmount,
    server_seed_hash: seed.server_seed_hash,
    client_seed:      seed.client_seed,
    nonce:            seed.nonce,
  });
  if (dbErr) console.error("keno_games insert:", dbErr);

  return NextResponse.json({
    drawnNumbers,
    matchedPicks,
    matches,
    multiplier,
    profit:         resultAmount,
    net:            resultAmount - bet,
    serverSeedHash: seed.server_seed_hash,
    clientSeed:     seed.client_seed,
    nonce:          seed.nonce + 1,
  });
}

async function handleRotateSeed(user: { id: string }) {
  const { data: active } = await supabase
    .from("keno_seeds")
    .select("id, server_seed")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (active) {
    await supabase
      .from("keno_seeds")
      .update({ is_active: false, revealed_at: new Date().toISOString() })
      .eq("id", active.id);
  }

  const serverSeed     = generateServerSeed();
  const serverSeedHash = hashSeed(serverSeed);
  await supabase.from("keno_seeds").insert({
    user_id: user.id, server_seed: serverSeed, server_seed_hash: serverSeedHash,
    client_seed: "default", nonce: 0, is_active: true,
  });

  return NextResponse.json({
    revealedServerSeed: active?.server_seed ?? null,
    newServerSeedHash:  serverSeedHash,
  });
}

async function handleSetClientSeed(user: { id: string }, body: Record<string, unknown>) {
  const clientSeed = String(body.clientSeed ?? "").trim();
  if (!clientSeed || clientSeed.length > 64)
    return NextResponse.json({ error: "Client seed inválida (máx 64 caracteres)" }, { status: 400 });

  const { data: active } = await supabase
    .from("keno_seeds").select("id").eq("user_id", user.id).eq("is_active", true).single();
  if (!active) return NextResponse.json({ error: "Sem seed ativa" }, { status: 404 });

  await supabase.from("keno_seeds").update({ client_seed: clientSeed, nonce: 0 }).eq("id", active.id);

  // Return the server seed hash so client can display it
  const { data: updated } = await supabase
    .from("keno_seeds").select("server_seed_hash").eq("id", active.id).single();
  return NextResponse.json({ clientSeed, nonce: 0, serverSeedHash: updated?.server_seed_hash ?? "" });
}

async function handleGetActiveSeed(user: { id: string }) {
  const seed = await getOrCreateActiveSeed(user.id);
  if (!seed) return NextResponse.json({ error: "Erro a obter seed" }, { status: 500 });
  // Never expose server_seed to the client — only its hash
  return NextResponse.json({
    seedId:         seed.id,
    serverSeedHash: seed.server_seed_hash,
    clientSeed:     seed.client_seed,
    nonce:          seed.nonce,
  });
}

async function handleVerify(user: { id: string }, gameId: string) {
  if (!gameId) return NextResponse.json({ error: "gameId obrigatório" }, { status: 400 });

  const { data: game } = await supabase
    .from("keno_games")
    .select("id, user_id, bet_amount, picks, drawn_numbers, matches, multiplier, server_seed_hash, client_seed, nonce")
    .eq("id", gameId)
    .eq("user_id", user.id)
    .single();

  if (!game) return NextResponse.json({ error: "Jogo não encontrado" }, { status: 404 });

  const { data: seed } = await supabase
    .from("keno_seeds")
    .select("server_seed")
    .eq("user_id", user.id)
    .eq("server_seed_hash", game.server_seed_hash)
    .not("server_seed", "is", null)
    .single();

  if (!seed?.server_seed) {
    return NextResponse.json({ game, verified: false, message: "Seed ainda não revelada — roda a seed para verificar." });
  }

  const expected    = generateDraw(seed.server_seed, game.client_seed, game.nonce);
  const expectedSet = new Set(expected);
  const drawMatches = expected.length === game.drawn_numbers.length &&
    (game.drawn_numbers as number[]).every((n) => expectedSet.has(n));

  return NextResponse.json({
    game,
    verified:   drawMatches,
    serverSeed: seed.server_seed,
    message:    drawMatches ? "✓ Resultado verificado com sucesso" : "✗ Verificação falhou",
  });
}

/* ═══════════════════════════════════════════════════════════════
   ROUTE EXPORTS
   ═══════════════════════════════════════════════════════════════ */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  if (!action || action === "payouts")
    return NextResponse.json({ payouts: PAYOUTS, gridSize: GRID_SIZE, drawCount: DRAW_COUNT });

  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  if (action === "active-seed") return handleGetActiveSeed(user);
  if (action === "verify")      return handleVerify(user, searchParams.get("gameId") ?? "");

  return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Corpo inválido" }, { status: 400 }); }

  const action = String(body.action ?? "");
  if (action === "play")             return handlePlay(user, body);
  if (action === "rotate-seed")      return handleRotateSeed(user);
  if (action === "set-client-seed")  return handleSetClientSeed(user, body);

  return NextResponse.json({ error: "Ação desconhecida" }, { status: 400 });
}
