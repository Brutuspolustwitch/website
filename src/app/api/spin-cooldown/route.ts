import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

const COOLDOWN_MS = 24 * 60 * 60 * 1000;

function getSession(raw: string): { id: string; login: string; role?: string } | null {
  try { return JSON.parse(raw); } catch { return null; }
}

/** GET /api/spin-cooldown — returns remaining cooldown ms and last_spin_at for the current user */
export async function GET() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("twitch_session")?.value;
  if (!raw) return NextResponse.json({ remainingMs: 0, canSpin: true });

  const session = getSession(raw);
  if (!session) return NextResponse.json({ remainingMs: 0, canSpin: true });

  const { data } = await supabase
    .from("users")
    .select("last_spin_at")
    .eq("twitch_id", session.id)
    .single();

  if (!data?.last_spin_at) {
    return NextResponse.json({ remainingMs: 0, canSpin: true });
  }

  const lastSpin = new Date(data.last_spin_at).getTime();
  const elapsed = Date.now() - lastSpin;
  const remainingMs = Math.max(0, COOLDOWN_MS - elapsed);

  return NextResponse.json({ remainingMs, canSpin: remainingMs === 0 });
}

/** POST /api/spin-cooldown — records spin timestamp for current user */
export async function POST() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("twitch_session")?.value;
  if (!raw) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const session = getSession(raw);
  if (!session) return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });

  // Double-check cooldown server-side before allowing
  const { data: user } = await supabase
    .from("users")
    .select("last_spin_at")
    .eq("twitch_id", session.id)
    .single();

  if (user?.last_spin_at) {
    const lastSpin = new Date(user.last_spin_at).getTime();
    const elapsed = Date.now() - lastSpin;
    if (elapsed < COOLDOWN_MS) {
      const remainingMs = COOLDOWN_MS - elapsed;
      return NextResponse.json({ error: "Cooldown ativo", remainingMs }, { status: 429 });
    }
  }

  const { error } = await supabase
    .from("users")
    .update({ last_spin_at: new Date().toISOString() })
    .eq("twitch_id", session.id);

  if (error) return NextResponse.json({ error: "Erro ao registar spin", detail: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

/** DELETE /api/spin-cooldown?userId=xxx — admin resets a user's cooldown */
export async function DELETE(request: Request) {
  const cookieStore = await cookies();
  const raw = cookieStore.get("twitch_session")?.value;
  if (!raw) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const session = getSession(raw);
  if (!session || !["admin", "configurador"].includes(session.role ?? "")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId em falta" }, { status: 400 });

  const { error } = await supabase
    .from("users")
    .update({ last_spin_at: null })
    .eq("id", userId);

  if (error) return NextResponse.json({ error: "Erro ao resetar cooldown" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
