import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/* ── GET /api/slots?q=searchterm ────────────────────────────────
   Returns up to 20 slots matching the search query.
   If q is empty, returns the 20 most recently added slots.
───────────────────────────────────────────────────────────────── */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  let query = supabase
    .from("slots")
    .select("id, name, provider, thumbnail_url")
    .order("name");

  if (q) {
    query = query.ilike("name", `%${q}%`);
  }

  const { data, error } = await query.limit(20);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ slots: data ?? [] });
}
