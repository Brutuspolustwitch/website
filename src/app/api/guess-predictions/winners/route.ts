import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  // Get last 5 resolved sessions with winner
  const { data: sessions, error } = await supabase
    .from("guess_sessions")
    .select("id, resolved_at, winner_user_id, winner_display_name, winner_predicted_amount, final_payout, users:winner_user_id(profile_image_url, login)")
    .eq("status", "resolved")
    .not("winner_user_id", "is", null)
    .order("resolved_at", { ascending: false })
    .limit(5);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ winners: sessions ?? [] });
}
