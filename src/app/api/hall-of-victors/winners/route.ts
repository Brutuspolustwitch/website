import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/* Sunday date (UTC) of the week containing `now` minus weeksOffset weeks. */
function weekId(weeksOffset = 0): string {
  const now = new Date();
  const dow = now.getUTCDay(); // 0=Sun
  const sun = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - dow));
  sun.setUTCDate(sun.getUTCDate() - weeksOffset * 7);
  return sun.toISOString().slice(0, 10);
}

/* GET ?week=YYYY-MM-DD (defaults to most recent frozen week, then live current) */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const explicit = searchParams.get("week");

  // 1) Explicit / most recent frozen
  const targetWeek = explicit ?? null;
  let frozen: { week_id: string; victories: unknown[] } | null = null;

  if (targetWeek) {
    const { data } = await supabase
      .from("hov_weekly_winners")
      .select("rank, victory:hov_victories(*)")
      .eq("week_id", targetWeek)
      .order("rank", { ascending: true });
    if (data && data.length > 0) {
      frozen = { week_id: targetWeek, victories: data.map(d => ({ ...(d.victory as object), rank: d.rank })) };
    }
  } else {
    const { data: latest } = await supabase
      .from("hov_weekly_winners")
      .select("week_id")
      .order("week_id", { ascending: false })
      .limit(1);
    if (latest && latest.length > 0) {
      const wk = latest[0].week_id;
      const { data } = await supabase
        .from("hov_weekly_winners")
        .select("rank, victory:hov_victories(*)")
        .eq("week_id", wk)
        .order("rank", { ascending: true });
      if (data && data.length > 0) {
        frozen = { week_id: wk, victories: data.map(d => ({ ...(d.victory as object), rank: d.rank })) };
      }
    }
  }

  // 2) Live current-week leaderboard preview
  const currentWeek = weekId(0);
  const { data: live } = await supabase
    .from("hov_victories")
    .select("*")
    .eq("status", "approved")
    .eq("week_id", currentWeek)
    .order("multiplier", { ascending: false })
    .order("win_amount", { ascending: false })
    .limit(3);

  return NextResponse.json({
    current_week: currentWeek,
    live_top3: (live ?? []).map((v, i) => ({ ...v, rank: i + 1 })),
    frozen,
  });
}
