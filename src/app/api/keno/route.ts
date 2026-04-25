import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

const GRID_SIZE  = 40;
const DRAW_COUNT = 10;
const SE_API     = "https://api.streamelements.com/kappa/v2";

/* ── Payout table: PAYOUTS[picks][matches] = multiplier ──────── */
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
  const token     = process.env.STREAMELEMENTS_JWT_TOKEN;
  const channelId = process.env.STREAMELEMENTS_CHANNEL_ID;
  if (!token || !channelId) return false;
  try {
    const res = await fetch(
      `${SE_API}/points/${channelId}/${encodeURIComponent(username)}/${amount}`,
      { method: "PUT", headers: { Accept: "application/json", Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`SE points PUT failed: ${res.status}`, detail);
      return false;
    }
    return true;
  } catch (err) {
    console.error("SE points error:", err);
    return false;
  }
}

/* ── Draw DRAW_COUNT unique numbers from 1..GRID_SIZE ─────────── */
function drawNumbers(): number[] {
  const pool = Array.from({ length: GRID_SIZE }, (_, i) => i + 1);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  // Return in draw order (not sorted) for animation feel
  return pool.slice(0, DRAW_COUNT);
}

function getMultiplier(pickCount: number, matches: number): number {
  return PAYOUTS[pickCount]?.[matches] ?? 0;
}

/* ── play action ──────────────────────────────────────────────── */
async function handlePlay(
  user: { id: string; login: string; se_username: string | null },
  body: Record<string, unknown>
) {
  const bet   = Number(body.bet);
  const picks = body.picks as number[];

  if (!bet || bet < 10 || bet > 1000) {
    return NextResponse.json({ error: "Aposta inválida (10–1000)" }, { status: 400 });
  }
  if (!Array.isArray(picks) || picks.length < 1 || picks.length > 10) {
    return NextResponse.json({ error: "Seleciona entre 1 e 10 números" }, { status: 400 });
  }
  if (picks.some((n) => !Number.isInteger(n) || n < 1 || n > GRID_SIZE)) {
    return NextResponse.json({ error: "Números inválidos" }, { status: 400 });
  }
  if (new Set(picks).size !== picks.length) {
    return NextResponse.json({ error: "Números duplicados" }, { status: 400 });
  }

  const seUser  = user.se_username || user.login;
  const deducted = await updateSEPoints(seUser, -bet);
  if (!deducted) {
    return NextResponse.json({ error: "Falha ao deduzir pontos. Verifica o teu saldo." }, { status: 502 });
  }

  const drawnNumbers  = drawNumbers();
  const drawnSet      = new Set(drawnNumbers);
  const matchedPicks  = picks.filter((n) => drawnSet.has(n));
  const matches       = matchedPicks.length;
  const multiplier    = getMultiplier(picks.length, matches);
  const resultAmount  = Math.floor(bet * multiplier);

  // Persist
  const { error: dbError } = await supabase.from("keno_games").insert({
    user_id:       user.id,
    bet_amount:    bet,
    picks,
    drawn_numbers: drawnNumbers,
    matches,
    multiplier,
    result_amount: resultAmount,
  });
  if (dbError) console.error("keno_games insert error:", dbError);

  // Credit winnings
  if (resultAmount > 0) {
    await updateSEPoints(seUser, resultAmount);
  }

  return NextResponse.json({
    success:      true,
    drawnNumbers,
    matches,
    matchedPicks,
    multiplier,
    profit:       resultAmount,
    net:          resultAmount - bet,
  });
}

/* ── getPayout action — returns payout table for N picks ─────── */
function handleGetPayouts(body: Record<string, unknown>) {
  const picks = Number(body.picks);
  if (!picks || picks < 1 || picks > 10) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }
  return NextResponse.json({ success: true, payouts: PAYOUTS[picks] ?? {} });
}

/* ── Main handler ─────────────────────────────────────────────── */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido" }, { status: 400 });
  }

  const { action } = body;

  // getPayout doesn't require auth
  if (action === "getPayout") return handleGetPayouts(body);

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (action === "play") return handlePlay(user, body);

  return NextResponse.json({ error: "Ação desconhecida" }, { status: 400 });
}

/* ── Expose payout table for client ──────────────────────────── */
export async function GET() {
  return NextResponse.json({ payouts: PAYOUTS });
}
