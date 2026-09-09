import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function currentMonthRange() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  return {
    monthId: start.toISOString().slice(0, 7),
    monthStart: start.toISOString(),
    monthEnd: end.toISOString(),
  };
}

export async function GET() {
  const { monthId, monthStart, monthEnd } = currentMonthRange();
  const { data, error } = await supabase
    .from("hov_victories")
    .select("*")
    .eq("status", "approved")
    .gte("created_at", monthStart)
    .lt("created_at", monthEnd)
    .order("multiplier", { ascending: false })
    .order("win_amount", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(3);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const monthTop3 = (data ?? []).map((v, i) => ({ ...v, rank: i + 1 }));

  return NextResponse.json({
    current_month: monthId,
    month_start: monthStart,
    month_end: monthEnd,
    month_top3: monthTop3,
    live_top3: monthTop3,
    frozen: null,
  });
}
