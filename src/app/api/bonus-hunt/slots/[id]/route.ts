import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

interface SessionCookie { id: string; login: string; role?: string }

function getSession(raw: string | undefined): SessionCookie | null {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface SlotRow {
  id: string;
  buy_value: number | null;
  bet_size: number | null;
  payout: number | null;
  result: number | null;
  opened: boolean;
  name: string;
}

async function recomputeSessionTotals(sessionId: string) {
  const { data: slots } = await supabase
    .from("bonus_hunt_slots")
    .select("id, buy_value, bet_size, payout, result, opened, name")
    .eq("session_id", sessionId);

  const list = (slots ?? []) as SlotRow[];
  const opened = list.filter((s) => s.opened);
  const total_buy = list.reduce((sum, s) => sum + (Number(s.buy_value) || 0), 0);
  const total_result = opened.reduce((sum, s) => sum + (Number(s.payout) || Number(s.result) || 0), 0);
  const profit = total_result - total_buy;

  let best_multi = 0;
  let best_slot_name: string | null = null;
  let multiSum = 0;
  let multiCount = 0;
  for (const s of opened) {
    const bet = Number(s.bet_size) || Number(s.buy_value) || 0;
    const win = Number(s.payout) || Number(s.result) || 0;
    if (bet > 0) {
      const m = win / bet;
      multiSum += m;
      multiCount += 1;
      if (m > best_multi) { best_multi = m; best_slot_name = s.name; }
    }
  }
  const avg_multi = multiCount > 0 ? multiSum / multiCount : 0;

  await supabase
    .from("bonus_hunt_sessions")
    .update({
      total_buy,
      total_result,
      profit,
      bonus_count: list.length,
      bonuses_opened: opened.length,
      avg_multi,
      best_multi,
      best_slot_name,
    })
    .eq("id", sessionId);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const session = getSession(cookieStore.get("twitch_session")?.value);
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { data: userRow } = await supabase
    .from("users")
    .select("role")
    .eq("twitch_id", session.id)
    .single();

  if (!userRow || !["admin", "configurador", "moderador"].includes(userRow.role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await request.json().catch(() => null) as { payout?: number | null; opened?: boolean } | null;
  if (!body) return NextResponse.json({ error: "Body inválido" }, { status: 400 });

  const update: Record<string, unknown> = {};

  if (body.payout !== undefined) {
    if (body.payout === null) {
      update.payout = null;
      update.result = null;
    } else {
      const n = Number(body.payout);
      if (!isFinite(n) || n < 0) {
        return NextResponse.json({ error: "Payout inválido" }, { status: 400 });
      }
      update.payout = n;
      update.result = n;
      // If a payout is set, also mark as opened/completed automatically
      if (body.opened === undefined) {
        update.opened = true;
        update.status = "completed";
      }
    }
  }

  if (body.opened !== undefined) {
    update.opened = body.opened;
    update.status = body.opened ? "completed" : "pending";
    if (!body.opened) {
      update.payout = null;
      update.result = null;
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar" }, { status: 400 });
  }

  const { data: updated, error } = await supabase
    .from("bonus_hunt_slots")
    .update(update)
    .eq("id", id)
    .select("id, session_id, payout, result, opened, status")
    .single();

  if (error || !updated) {
    return NextResponse.json({ error: error?.message ?? "Erro ao atualizar" }, { status: 500 });
  }

  await recomputeSessionTotals(updated.session_id);

  return NextResponse.json({ slot: updated });
}
