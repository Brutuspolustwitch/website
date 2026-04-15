import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** GET /api/daily-session — get the active session (public) */
export async function GET() {
  const { data, error } = await supabase
    .from("daily_sessions")
    .select("*, casino:casino_id(id, name, slug, logo_url, logo_bg, banner_url, headline, bonus_value, free_spins, min_deposit, code, cashback, withdraw_time, license, established, tags, notes, affiliate_url, rating, badge)")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ session: data });
}

/** POST /api/daily-session — create or update session (admin only) */
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const raw = cookieStore.get("twitch_session")?.value;
  if (!raw) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let session: { id: string; role: string };
  try { session = JSON.parse(raw); } catch { return NextResponse.json({ error: "Invalid session" }, { status: 401 }); }

  if (session.role !== "admin" && session.role !== "configurador") {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const body = await request.json();

  // If updating an existing session
  if (body.id) {
    // If setting active, deactivate all others first
    if (body.is_active) {
      await supabase.from("daily_sessions").update({ is_active: false }).neq("id", body.id);
    }

    const { data, error } = await supabase
      .from("daily_sessions")
      .update({
        title: body.title,
        session_date: body.session_date,
        casino_id: body.casino_id || null,
        spotify_url: body.spotify_url || null,
        deposits: body.deposits ?? 0,
        withdrawals: body.withdrawals ?? 0,
        bonuses_count: body.bonuses_count ?? 0,
        biggest_win: body.biggest_win ?? 0,
        is_active: body.is_active ?? false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ session: data });
  }

  // Creating a new session — deactivate all others if this one is active
  if (body.is_active) {
    await supabase.from("daily_sessions").update({ is_active: false }).eq("is_active", true);
  }

  const { data, error } = await supabase
    .from("daily_sessions")
    .insert({
      title: body.title || "Sessão do Dia",
      session_date: body.session_date || new Date().toISOString().split("T")[0],
      casino_id: body.casino_id || null,
      spotify_url: body.spotify_url || null,
      deposits: body.deposits ?? 0,
      withdrawals: body.withdrawals ?? 0,
      bonuses_count: body.bonuses_count ?? 0,
      biggest_win: body.biggest_win ?? 0,
      is_active: body.is_active ?? true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ session: data }, { status: 201 });
}
