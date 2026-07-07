import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import { notify } from "@/lib/notify";
import type { WheelSegmentRow } from "@/lib/supabase";

const COOLDOWN_MS = 24 * 60 * 60 * 1000;
const SE_API = "https://api.streamelements.com/kappa/v2";

type Session = { id: string; login: string; role?: string };
type WheelUser = {
  id: string;
  twitch_id: string;
  login: string;
  se_username: string | null;
  last_spin_at: string | null;
};

function getSession(raw: string): Session | null {
  try { return JSON.parse(raw); } catch { return null; }
}

function getSEHeaders() {
  const token = process.env.STREAMELEMENTS_JWT_TOKEN;
  if (!token) return null;
  return { Accept: "application/json", Authorization: `Bearer ${token}` };
}

function getSEChannelId() {
  return process.env.STREAMELEMENTS_CHANNEL_ID || "";
}

async function updateSEPoints(username: string, amount: number): Promise<boolean> {
  const headers = getSEHeaders();
  const channelId = getSEChannelId();
  if (!headers || !channelId) return false;

  try {
    const res = await fetch(
      `${SE_API}/points/${channelId}/${encodeURIComponent(username)}/${amount}`,
      { method: "PUT", headers }
    );

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`Daily wheel SE points PUT failed: ${res.status}`, detail);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Daily wheel SE points error:", err);
    return false;
  }
}

function weightedRandomSegment(segments: WheelSegmentRow[]): WheelSegmentRow {
  const totalWeight = segments.reduce((sum, segment) => sum + segment.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const segment of segments) {
    roll -= segment.weight;
    if (roll <= 0) return segment;
  }

  return segments[segments.length - 1];
}

/** GET /api/spin-cooldown - returns remaining cooldown ms and last_spin_at for the current user */
export async function GET() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("twitch_session")?.value;
  if (!raw) return NextResponse.json({ remainingMs: 0, canSpin: true });

  const session = getSession(raw);
  if (!session) return NextResponse.json({ remainingMs: 0, canSpin: true });

  const { data } = await supabase
    .from("users")
    .select("last_spin_at")
    .eq("twitch_id", session.id)
    .single();

  if (!data?.last_spin_at) {
    return NextResponse.json({ remainingMs: 0, canSpin: true });
  }

  const lastSpin = new Date(data.last_spin_at).getTime();
  const elapsed = Date.now() - lastSpin;
  const remainingMs = Math.max(0, COOLDOWN_MS - elapsed);

  return NextResponse.json({ remainingMs, canSpin: remainingMs === 0 });
}

/** POST /api/spin-cooldown - server-authoritative daily wheel spin + SE award */
export async function POST() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("twitch_session")?.value;
  if (!raw) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  const session = getSession(raw);
  if (!session) return NextResponse.json({ error: "Sessao invalida" }, { status: 401 });

  const { data: user, error: userErr } = await supabase
    .from("users")
    .select("id, twitch_id, login, se_username, last_spin_at")
    .eq("twitch_id", session.id)
    .single<WheelUser>();

  if (userErr || !user) {
    return NextResponse.json({ error: "Utilizador nao encontrado" }, { status: 404 });
  }

  if (user.last_spin_at) {
    const lastSpin = new Date(user.last_spin_at).getTime();
    const elapsed = Date.now() - lastSpin;
    if (elapsed < COOLDOWN_MS) {
      const remainingMs = COOLDOWN_MS - elapsed;
      return NextResponse.json({ error: "Cooldown ativo", remainingMs }, { status: 429 });
    }
  }

  const { data: segments, error: segErr } = await supabase
    .from("wheel_segments")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (segErr) {
    return NextResponse.json({ error: "Erro ao carregar roda", detail: segErr.message }, { status: 500 });
  }

  const activeSegments = ((segments ?? []) as WheelSegmentRow[]).filter((segment) => segment.weight > 0);
  if (activeSegments.length === 0) {
    return NextResponse.json({ error: "Roda sem segmentos ativos" }, { status: 500 });
  }

  const winner = weightedRandomSegment(activeSegments);
  const rewardAmount = Math.max(0, Math.floor(Number(winner.reward_value) || 0));
  const shouldAwardSEPoints = winner.reward_type === "SE_POINTS" && rewardAmount > 0 && winner.tier !== "loss";
  let seAwarded = false;

  if (shouldAwardSEPoints) {
    seAwarded = await updateSEPoints(user.se_username || user.login || session.login, rewardAmount);
  }

  const { error } = await supabase
    .from("users")
    .update({ last_spin_at: new Date().toISOString() })
    .eq("twitch_id", session.id);

  if (error) return NextResponse.json({ error: "Erro ao registar spin", detail: error.message }, { status: 500 });

  if (winner.tier !== "loss") {
    const isJackpot = winner.tier === "legendary";
    const type = isJackpot ? "jackpot_win" : "se_points_earned";
    const title = isJackpot ? "JACKPOT na Roda Diaria!" : "Premio na Roda Diaria!";
    const message =
      winner.reward_type === "SE_POINTS" && rewardAmount > 0
        ? `Ganhou ${rewardAmount.toLocaleString("pt-PT")} pontos SE na Roda Diaria!`
        : isJackpot
          ? `Ganhou o JACKPOT na Roda Diaria! Premio: ${winner.label}`
          : `Ganhou ${winner.label} na Roda Diaria!`;
    await notify(session.id, type, title, message);
  }

  return NextResponse.json({
    ok: true,
    reward: winner,
    seAward: {
      attempted: shouldAwardSEPoints,
      awarded: seAwarded,
      amount: shouldAwardSEPoints ? rewardAmount : 0,
    },
  });
}

/** DELETE /api/spin-cooldown?userId=xxx - admin resets a user's cooldown */
export async function DELETE(request: Request) {
  const cookieStore = await cookies();
  const raw = cookieStore.get("twitch_session")?.value;
  if (!raw) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  const session = getSession(raw);
  if (!session || !["admin", "configurador"].includes(session.role ?? "")) {
    return NextResponse.json({ error: "Sem permissao" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId em falta" }, { status: 400 });

  const { error } = await supabase
    .from("users")
    .update({ last_spin_at: null })
    .eq("id", userId);

  if (error) return NextResponse.json({ error: "Erro ao resetar cooldown" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
