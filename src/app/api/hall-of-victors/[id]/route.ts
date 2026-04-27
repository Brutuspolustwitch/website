import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const APPROVAL_REWARD = 300; // SE points

type Session = { id: string; login: string; role?: string };

async function getModSession(): Promise<Session | null> {
  const c = await cookies();
  const raw = c.get("twitch_session")?.value;
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as Session;
    if (!["admin", "configurador", "moderador"].includes(s.role ?? "")) return null;
    return s;
  } catch { return null; }
}

async function getUserDbId(twitchId: string): Promise<string | null> {
  const { data } = await supabase.from("users").select("id").eq("twitch_id", twitchId).maybeSingle();
  return data?.id ?? null;
}

/* Best-effort SE points award. Silent on failure so moderation isn't blocked. */
async function awardSEPoints(twitchUsername: string | null | undefined, amount: number) {
  if (!twitchUsername) return;
  const SE_API = "https://api.streamelements.com/kappa/v2";
  const channelId = process.env.STREAMELEMENTS_CHANNEL_ID;
  const token = process.env.STREAMELEMENTS_JWT;
  if (!channelId || !token) return;
  try {
    await fetch(
      `${SE_API}/points/${channelId}/${encodeURIComponent(twitchUsername)}/${amount}`,
      { method: "PUT", headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }
    );
  } catch (e) {
    console.error("HOV award SE points failed:", e);
  }
}

/* ── PATCH — moderate / edit ── */
export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const mod = await getModSession();
  if (!mod) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });


  let body: Record<string, unknown>;
  try { body = (await request.json()) as Record<string, unknown>; }
  catch { return NextResponse.json({ error: "Pedido inválido" }, { status: 400 }); }

  const action = body.action as string | undefined;

  // Load existing victory
  const { data: existing, error: loadErr } = await supabase
    .from("hov_victories").select("*").eq("id", id).maybeSingle();
  if (loadErr) return NextResponse.json({ error: loadErr.message }, { status: 500 });
  if (!existing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  // Award SSE points to a user for a victory (manual moderator action)
  if (action === "award_points") {
    const amount = typeof body.amount === "number" && body.amount > 0 ? Math.floor(body.amount) : null;
    if (!amount) return NextResponse.json({ error: "Valor inválido" }, { status: 400 });
    // Fetch winner's twitch login
    const { data: winner } = await supabase
      .from("users").select("login, se_username").eq("id", existing.user_id).maybeSingle();
    await awardSEPoints(winner?.se_username || winner?.login, amount);
    return NextResponse.json({ ok: true, awarded: amount });
  }




  const modUserId = await getUserDbId(mod.id);

  if (action === "approve") {
    if (existing.status === "approved") {
      return NextResponse.json({ victory: existing }); // idempotent, locked
    }
    // Apply final field edits BEFORE approval (multiplier locks after).
    const patch: Record<string, unknown> = {
      status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: modUserId,
    };
    const editable = ["slot_name", "provider", "bet_amount", "win_amount", "caption", "image_url", "url", "suspicious"] as const;
    for (const k of editable) {
      if (body[k] !== undefined) patch[k] = body[k];
    }
    // Image required at approval time
    const finalImage = (patch.image_url ?? existing.image_url) as string | null;
    if (!finalImage || typeof finalImage !== "string" || !/^https?:\/\//i.test(finalImage)) {
      return NextResponse.json({ error: "Adiciona uma imagem antes de aprovar" }, { status: 400 });
    }
    if (typeof patch.bet_amount === "number" && typeof patch.win_amount === "number" && patch.bet_amount > 0) {
      patch.multiplier = Math.round((patch.win_amount / patch.bet_amount) * 100) / 100;
    } else if (typeof body.multiplier === "number") {
      patch.multiplier = body.multiplier;
    }

    const { data: updated, error } = await supabase
      .from("hov_victories").update(patch).eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Reward — fetch winner's twitch login
    const { data: winner } = await supabase
      .from("users").select("login, se_username").eq("id", existing.user_id).maybeSingle();
    await awardSEPoints(winner?.se_username || winner?.login, APPROVAL_REWARD);

    return NextResponse.json({ victory: updated, awarded: APPROVAL_REWARD });
  }

  if (action === "reject") {
    const reason = typeof body.reason === "string" ? body.reason.slice(0, 500) : null;
    const { data: updated, error } = await supabase
      .from("hov_victories")
      .update({ status: "rejected", rejection_reason: reason, approved_by: modUserId })
      .eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ victory: updated });
  }

  // Plain edit (only allowed while pending)
  if (existing.status !== "pending") {
    return NextResponse.json({ error: "Apenas vitórias pendentes podem ser editadas" }, { status: 409 });
  }
  const editable = ["slot_name", "provider", "bet_amount", "win_amount", "caption", "image_url", "url", "suspicious"] as const;
  const patch: Record<string, unknown> = {};
  for (const k of editable) if (body[k] !== undefined) patch[k] = body[k];
  if (typeof patch.bet_amount === "number" && typeof patch.win_amount === "number" && patch.bet_amount > 0) {
    patch.multiplier = Math.round((patch.win_amount / patch.bet_amount) * 100) / 100;
    patch.suspicious = (patch.multiplier as number) > 10000 ? true : existing.suspicious;
  }
  const { data: updated, error } = await supabase
    .from("hov_victories").update(patch).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ victory: updated });
}

/* ── DELETE — moderator only ── */
export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const mod = await getModSession();
  if (!mod) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  const { id } = await ctx.params;
  const { error } = await supabase.from("hov_victories").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
