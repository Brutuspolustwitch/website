import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Auth check — admin only
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("twitch_session")?.value;

  if (!sessionCookie) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  let session;
  try {
    session = JSON.parse(sessionCookie);
  } catch {
    return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
  }

  if (session.role !== "admin" && session.role !== "configurador") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  // Slots cascade-delete via FK, so just delete session
  const { error } = await supabase
    .from("bonus_hunt_sessions")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "Erro ao eliminar: " + error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
