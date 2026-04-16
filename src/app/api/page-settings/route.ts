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
    return session as { id: string; role: string };
  } catch {
    return null;
  }
}

/* ── GET — fetch all page settings ─────────────────────────── */
export async function GET() {
  const { data, error } = await supabase
    .from("page_settings")
    .select("*")
    .order("page_name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ settings: data ?? [] });
}

/* ── PUT — update a single page setting ────────────────────── */
export async function PUT(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json();
  const { id, background_image, hero_image, effect, effect_intensity, overlay_opacity } = body;

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  const validEffects = ["none", "snow", "rain", "thunder", "fireflies"];
  if (effect && !validEffects.includes(effect)) {
    return NextResponse.json({ error: "Invalid effect" }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (background_image !== undefined) updates.background_image = background_image || null;
  if (hero_image !== undefined) updates.hero_image = hero_image || null;
  if (effect !== undefined) updates.effect = effect;
  if (effect_intensity !== undefined) updates.effect_intensity = Math.min(2, Math.max(0, Number(effect_intensity)));
  if (overlay_opacity !== undefined) updates.overlay_opacity = Math.min(1, Math.max(0, Number(overlay_opacity)));

  const { data, error } = await supabase
    .from("page_settings")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ setting: data });
}
