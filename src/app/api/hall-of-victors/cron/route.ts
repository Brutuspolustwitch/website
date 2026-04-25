import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/* Sunday date (UTC) of the week containing `now` minus weeksOffset weeks. */
function weekId(weeksOffset: number): string {
  const now = new Date();
  const dow = now.getUTCDay();
  const sun = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - dow));
  sun.setUTCDate(sun.getUTCDate() - weeksOffset * 7);
  return sun.toISOString().slice(0, 10);
}

/* Cron entry point — schedule via Vercel Cron (vercel.json) or external scheduler.
 * Freezes the PREVIOUS week's top 3 into hov_weekly_winners.
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

  return NextResponse.json({
    frozen_week: targetWeek,
    winners: (winners ?? []).map(w => ({ rank: w.rank, victory: w.victory })),
  });
}

// Vercel Cron triggers via GET — keep parity.
export const GET = POST;
