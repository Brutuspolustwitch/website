import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("sobre_content")
    .select("data")
    .eq("id", 1)
    .single();

  if (error || !data) {
    return NextResponse.json({ data: null }, { status: 200 });
  }
  return NextResponse.json({ data: data.data });
}

export async function PUT(req: NextRequest) {
  const supabase = getSupabase();
  const body = await req.json();

  const { error } = await supabase
    .from("sobre_content")
    .update({ data: body, updated_at: new Date().toISOString() })
    .eq("id", 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
