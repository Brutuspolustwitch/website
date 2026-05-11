import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** GET /api/jackpot — returns current jackpot amount (public) */
export async function GET() {
  const { data, error } = await supabase
    .from("jackpot")
    .select("amount")
    .eq("id", 1)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ amount: Number(data.amount) });
}

/** PATCH /api/jackpot — manually set jackpot amount (admin/configurador/moderador only) */
export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const raw = cookieStore.get("twitch_session")?.value;
  if (!raw) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  let session: { id: string; role: string };
  try { session = JSON.parse(raw); } catch { return NextResponse.json({ error: "Sessão inválida" }, { status: 401 }); }

  if (!["admin", "configurador", "moderador"].includes(session.role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await request.json();
  const amount = parseFloat(body.amount);
  if (isNaN(amount) || amount < 0) {
    return NextResponse.json({ error: "Valor inválido" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("jackpot")
    .update({ amount, updated_at: new Date().toISOString() })
    .eq("id", 1)
    .select("amount")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ amount: Number(data.amount) });
}
