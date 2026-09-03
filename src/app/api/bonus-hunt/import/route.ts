import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import { importBonusHunt, type SourceBonusHunt } from "@/lib/bonusHuntImport";

export const dynamic = "force-dynamic";

async function incrementJackpot() {
  const { data: jackpotRow } = await supabase
    .from("jackpot")
    .select("amount")
    .eq("id", 1)
    .single();

  if (jackpotRow != null) {
    await supabase
      .from("jackpot")
      .update({ amount: Number(jackpotRow.amount ?? 30) + 1, updated_at: new Date().toISOString() })
      .eq("id", 1);
  }
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("twitch_session")?.value;

  if (!sessionCookie) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  let session: { role?: string } | null;
  try {
    session = JSON.parse(sessionCookie);
  } catch {
    return NextResponse.json({ error: "Sessao invalida" }, { status: 401 });
  }

  if (session?.role !== "admin" && session?.role !== "configurador") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  let data: SourceBonusHunt;
  try {
    data = (await request.json()) as SourceBonusHunt;
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
  }

  const huntName = data.hunt_name || data.huntName || data.name;
  const bonuses = data.bonuses || data.slots || data.items;

  if (!huntName || !Array.isArray(bonuses)) {
    return NextResponse.json(
      { error: "Campos obrigatorios em falta: hunt_name, bonuses" },
      { status: 400 }
    );
  }

  try {
    const result = await importBonusHunt(
      { ...data, hunt_name: huntName, phase: data.phase ?? "completed" },
      { mode: "upsert-active" }
    );

    if (result.created) {
      await incrementJackpot();
    }

    return NextResponse.json({
      success: true,
      session_id: result.sessionId,
      slots_imported: result.slotsImported,
      hunt_name: result.huntName,
      phase: result.phase,
      created: result.created,
      daily_session_updated: result.dailySession.updated,
      daily_session_id: result.dailySession.sessionId,
      daily_session_fields: result.dailySession.fields,
      daily_session_error: result.dailySession.error,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
