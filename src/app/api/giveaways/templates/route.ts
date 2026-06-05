import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/* ── Auth helper ───────────────────────────────────────────── */
async function requireAdmin() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("twitch_session")?.value;
  if (!raw) return null;
  try {
    const session = JSON.parse(raw);
    if (session.role !== "admin" && session.role !== "configurador") return null;
    return session as { id: string; role: string; login: string };
  } catch {
    return null;
  }
}

/* ── GET — list all templates ──────────────────────────────── */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("giveaway_templates")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ templates: data ?? [] });
}

/* ── POST — create template ────────────────────────────────── */
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, title, description, prize, prize_image, mode, ticket_cost, max_entries_per_user, chat_command, require_live, cta_text, cta_url, cta_color } = body;

  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const { data, error } = await supabase
    .from("giveaway_templates")
    .insert({
      name,
      title: title || "",
      description: description || "",
      prize: prize || "",
      prize_image: prize_image || null,
      mode: mode || "single",
      ticket_cost: ticket_cost || 0,
      max_entries_per_user: max_entries_per_user || null,
      chat_command: chat_command || "!enter",
      require_live: require_live !== false,
      cta_text: cta_text || null,
      cta_url: cta_url || null,
      cta_color: cta_color || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ template: data }, { status: 201 });
}

/* ── DELETE — remove template ──────────────────────────────── */
export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const { error } = await supabase.from("giveaway_templates").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
