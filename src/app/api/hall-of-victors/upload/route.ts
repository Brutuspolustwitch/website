import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getSession() {
  const c = await cookies();
  const raw = c.get("twitch_session")?.value;
  if (!raw) return null;
  try { return JSON.parse(raw) as { id: string; login: string; role?: string }; } catch { return null; }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "file required" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type))
    return NextResponse.json({ error: "Use JPG, PNG, WebP ou GIF." }, { status: 400 });
  if (file.size > MAX_SIZE)
    return NextResponse.json({ error: "Máximo 5 MB." }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeName = `${session.id}-${Date.now()}.${ext}`;
  const path = `hall-of-victors/${safeName}`;
  const buffer = new Uint8Array(await file.arrayBuffer());

  const sb = getAdmin();
  const { error } = await sb.storage.from("images").upload(path, buffer, {
    contentType: file.type, upsert: false,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = sb.storage.from("images").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
