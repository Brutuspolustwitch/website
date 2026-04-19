import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function getSession() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("twitch_session")?.value;
  if (!raw) return null;
  try { return JSON.parse(raw) as { id: string }; }
  catch { return null; }
}

/* ── POST — toggle honor on a clip ─────────────────────────── */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  /* Check if already honored */
  const { data: existing } = await supabase
    .from("clip_honors")
    .select("id")
    .eq("clip_id", id)
    .eq("user_twitch_id", session.id)
    .maybeSingle();

  if (existing) {
    /* Remove honor */
    await supabase.from("clip_honors").delete().eq("id", existing.id);
    await supabase.rpc("decrement_clip_honors", { clip_id_arg: id });
    return NextResponse.json({ honored: false });
  } else {
    /* Add honor */
    await supabase.from("clip_honors").insert({ clip_id: id, user_twitch_id: session.id });
    await supabase.rpc("increment_clip_honors", { clip_id_arg: id });
    return NextResponse.json({ honored: true });
  }
}
