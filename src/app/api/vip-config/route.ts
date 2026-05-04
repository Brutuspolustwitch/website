import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

export interface VipConfig {
  warrior_min: number;
  champion_min: number;
  legend_min: number;
}

/** GET /api/vip-config — public, returns current thresholds */
export async function GET() {
  const { data, error } = await supabase
    .from("vip_config")
    .select("warrior_min, champion_min, legend_min")
    .eq("id", 1)
    .single();

  if (error || !data) {
    // Return hardcoded defaults if table doesn't exist yet
    return NextResponse.json({ warrior_min: 500, champion_min: 2000, legend_min: 5000 });
  }
  return NextResponse.json(data);
}

/** PATCH /api/vip-config — admin only, updates thresholds */
export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const raw = cookieStore.get("twitch_session")?.value;
  if (!raw) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  let session: { id: string; login: string; role?: string };
  try { session = JSON.parse(raw); } catch { return NextResponse.json({ error: "Sessão inválida" }, { status: 401 }); }

  if (session.role !== "admin") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await request.json();
  const warrior_min = parseInt(body.warrior_min);
  const champion_min = parseInt(body.champion_min);
  const legend_min = parseInt(body.legend_min);

  if (isNaN(warrior_min) || isNaN(champion_min) || isNaN(legend_min)) {
    return NextResponse.json({ error: "Valores inválidos" }, { status: 400 });
  }
  if (warrior_min >= champion_min || champion_min >= legend_min) {
    return NextResponse.json({ error: "Os valores devem ser crescentes: Warrior < Champion < Legend" }, { status: 400 });
  }

  const { error } = await supabase
    .from("vip_config")
    .upsert({ id: 1, warrior_min, champion_min, legend_min, updated_at: new Date().toISOString() });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, warrior_min, champion_min, legend_min });
}
