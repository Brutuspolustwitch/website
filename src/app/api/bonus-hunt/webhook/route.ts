import { NextRequest, NextResponse } from "next/server";
import { importBonusHunt, type SourceBonusHunt } from "@/lib/bonusHuntImport";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.BONUS_HUNT_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[webhook] BONUS_HUNT_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "Webhook nao configurado" }, { status: 503 });
  }

  const incomingKey = request.headers.get("x-api-key");
  if (!incomingKey || incomingKey !== webhookSecret) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  let data: SourceBonusHunt;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
  }

  if (!data.hunt_name && !data.huntName && !data.name) {
    return NextResponse.json({ error: "Campo obrigatorio em falta: hunt_name" }, { status: 400 });
  }

  const bonuses = data.bonuses || data.slots || data.items;
  if (!Array.isArray(bonuses)) {
    return NextResponse.json({ error: "Campo obrigatorio em falta: bonuses" }, { status: 400 });
  }

  if (data.phase && !["hunting", "opening", "completed"].includes(data.phase)) {
    return NextResponse.json(
      { error: "phase deve ser 'hunting', 'opening' ou 'completed'" },
      { status: 400 }
    );
  }

  try {
    const result = await importBonusHunt(data, { mode: "upsert-active" });
    console.log(
      `[webhook] ${result.created ? "imported" : "updated"} "${result.huntName}" -> session ${result.sessionId} (${result.slotsImported} slots)`
    );

    return NextResponse.json({
      success: true,
      session_id: result.sessionId,
      slots_imported: result.slotsImported,
      hunt_name: result.huntName,
      phase: result.phase,
      created: result.created,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "desconhecido";
    console.error("[webhook] import error:", error);
    return NextResponse.json({ error: "Erro ao importar bonus hunt: " + message }, { status: 500 });
  }
}
