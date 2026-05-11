import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const SE_API = "https://api.streamelements.com/kappa/v2";
const PODIUM_REWARDS: Record<number, number> = { 1: 1500, 2: 750, 3: 500 };

/* Sunday date (UTC) of the week containing `now` minus weeksOffset weeks. */
function weekId(weeksOffset: number): string {
  const now = new Date();
  const dow = now.getUTCDay();
  const sun = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - dow));
  sun.setUTCDate(sun.getUTCDate() - weeksOffset * 7);
  return sun.toISOString().slice(0, 10);
}

/* Best-effort SE points award for weekly podium. Silent on failure. */
async function awardPodiumPoints(twitchUsername: string | null | undefined, amount: number) {
  if (!twitchUsername) return;
  const channelId = process.env.SE_CHANNEL_ID;
  const token = process.env.SE_JWT;
  if (!channelId || !token) return;
  try {
    await fetch(
      `${SE_API}/points/${channelId}/${encodeURIComponent(twitchUsername)}/${amount}`,
      { method: "PUT", headers: { Authorization: `Bearer ${token}` } },
    );
  } catch (e) {
    console.error("HOV cron award SE points failed:", e);
  }
}

/* Cron entry point — schedule via Vercel Cron (vercel.json) or external scheduler.
 * Freezes the PREVIOUS week's top 3 into hov_weekly_winners and awards SE points.
 *
 * Auth: requires `Authorization: Bearer <CRON_SECRET>` header (Vercel Cron sets this
 * automatically when you configure CRON_SECRET env var).
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const { searchParams } = new URL(request.url);
  // Allow explicit week override for backfills; default = previous week.
  const targetWeek = searchParams.get("week") ?? weekId(1);

  const { error } = await supabase.rpc("hov_freeze_week", { target_week: targetWeek });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: winners } = await supabase
    .from("hov_weekly_winners")
    .select("rank, victory:hov_victories(*)")
    .eq("week_id", targetWeek)
    .order("rank", { ascending: true });

  // Award SE points to each podium finisher
  const awarded: { rank: number; username: string; points: number }[] = [];
  for (const w of winners ?? []) {
    const v = w.victory as Record<string, unknown> | null;
    const username = (v?.se_username ?? v?.login) as string | null;
    const pts = PODIUM_REWARDS[w.rank];
    if (username && pts) {
      await awardPodiumPoints(username, pts);
      awarded.push({ rank: w.rank, username, points: pts });
    }
  }

  return NextResponse.json({
    frozen_week: targetWeek,
    winners: (winners ?? []).map(w => ({ rank: w.rank, victory: w.victory })),
    awarded,
  });
}

// Vercel Cron triggers via GET — keep parity.
export const GET = POST;
