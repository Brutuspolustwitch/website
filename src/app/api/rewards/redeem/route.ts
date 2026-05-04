import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

const SE_API = "https://api.streamelements.com/kappa/v2";

function getHeaders() {
  const token = process.env.STREAMELEMENTS_JWT_TOKEN;
  if (!token) return null;
  return { Accept: "application/json", Authorization: `Bearer ${token}` };
}

function getChannelId() {
  return process.env.STREAMELEMENTS_CHANNEL_ID || "";
}

/** POST /api/rewards/redeem — redeem a reward */
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const raw = cookieStore.get("twitch_session")?.value;
  if (!raw) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  let session: { id: string; login: string };
  try { session = JSON.parse(raw); } catch { return NextResponse.json({ error: "Sessão inválida" }, { status: 401 }); }

  const body = await request.json();
  const rewardId = body.rewardId;
  if (!rewardId) return NextResponse.json({ error: "ID da recompensa em falta" }, { status: 400 });

  // Fetch reward
  const { data: reward, error: rewardErr } = await supabase
    .from("rewards")
    .select("*")
    .eq("id", rewardId)
    .eq("active", true)
    .single();

  if (rewardErr || !reward) {
    return NextResponse.json({ error: "Recompensa não encontrada" }, { status: 404 });
  }

  // Check stock
  if (reward.stock !== null && reward.stock <= 0) {
    return NextResponse.json({ error: "Sem stock disponível" }, { status: 400 });
  }

  // Check cooldown
  if (reward.cooldown) {
    const cooldownSince = new Date(Date.now() - reward.cooldown * 3600000).toISOString();
    const { data: recentRedemption } = await supabase
      .from("reward_redemptions")
      .select("id")
      .eq("reward_id", rewardId)
      .eq("user_twitch_id", session.id)
      .gte("created_at", cooldownSince)
      .limit(1);

    if (recentRedemption && recentRedemption.length > 0) {
      return NextResponse.json({ error: `Cooldown ativo. Tenta novamente mais tarde.` }, { status: 400 });
    }
  }

  // Check VIP requirement
  if (reward.vip_only && reward.vip_level_required) {
    // Fetch VIP thresholds from config (falls back to defaults if not set)
    const { data: vipCfg } = await supabase
      .from("vip_config")
      .select("warrior_min, champion_min, legend_min")
      .eq("id", 1)
      .single();
    const warriorMin = vipCfg?.warrior_min ?? 500;
    const championMin = vipCfg?.champion_min ?? 2000;
    const legendMin = vipCfg?.legend_min ?? 5000;

    // Get user points to determine VIP level via ranks
    const headers = getHeaders();
    const channelId = getChannelId();
    if (headers && channelId) {
      const pointsRes = await fetch(
        `${SE_API}/points/${channelId}/${encodeURIComponent(session.login)}`,
        { headers }
      );
      if (pointsRes.ok) {
        const pointsData = await pointsRes.json();
        const userPoints = pointsData.points || 0;
        let vipLevel = 0;
        if (userPoints >= legendMin) vipLevel = 3;
        else if (userPoints >= championMin) vipLevel = 2;
        else if (userPoints >= warriorMin) vipLevel = 1;

        if (vipLevel < reward.vip_level_required) {
          return NextResponse.json({ error: "Nível VIP insuficiente" }, { status: 403 });
        }
      }
    }
  }

  // Fetch user points from SE
  const headers = getHeaders();
  const channelId = getChannelId();
  if (!headers || !channelId) {
    return NextResponse.json({ error: "StreamElements não configurado" }, { status: 503 });
  }

  const pointsRes = await fetch(
    `${SE_API}/points/${channelId}/${encodeURIComponent(session.login)}`,
    { headers }
  );
  if (!pointsRes.ok) {
    return NextResponse.json({ error: "Não foi possível verificar os pontos" }, { status: 502 });
  }
  const pointsData = await pointsRes.json();
  const currentPoints = pointsData.points || 0;

  if (currentPoints < reward.cost) {
    return NextResponse.json({ error: "Pontos insuficientes" }, { status: 400 });
  }

  // Deduct points via SE API (negative amount deducts)
  const deductRes = await fetch(
    `${SE_API}/points/${channelId}/${encodeURIComponent(session.login)}/${-reward.cost}`,
    { method: "PUT", headers }
  );

  if (!deductRes.ok) {
    return NextResponse.json({ error: "Falha ao deduzir pontos" }, { status: 502 });
  }

  // Record redemption as pending
  await supabase.from("reward_redemptions").insert({
    reward_id: rewardId,
    user_twitch_id: session.id,
    cost: reward.cost,
    status: "pending",
  });

  // Decrease stock if applicable
  if (reward.stock !== null) {
    await supabase
      .from("rewards")
      .update({ stock: reward.stock - 1, updated_at: new Date().toISOString() })
      .eq("id", rewardId);
  }

  return NextResponse.json({ ok: true, newPoints: currentPoints - reward.cost });
}
