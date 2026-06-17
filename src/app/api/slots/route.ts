import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type TwitchSession = {
  role?: string;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "Erro desconhecido";
}

async function getSession() {
  const cookieStore = await cookies();
  const value = cookieStore.get("twitch_session")?.value;
  if (!value) return null;

  try {
    return JSON.parse(value) as TwitchSession;
  } catch {
    return null;
  }
}

function canManageSlots(session: TwitchSession | null) {
  return session?.role === "admin" || session?.role === "configurador" || session?.role === "moderador";
}

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

export async function POST(request: Request) {
  const session = await getSession();
  if (!canManageSlots(session)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const provider = typeof body.provider === "string" ? body.provider.trim() : "";
  const thumbnailUrl = typeof body.thumbnail_url === "string" && body.thumbnail_url.trim()
    ? body.thumbnail_url.trim()
    : null;

  if (!name) {
    return NextResponse.json({ error: "Nome da slot é obrigatório" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("slots")
    .upsert(
      {
        name,
        provider,
        thumbnail_url: thumbnailUrl,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "name,provider" }
    )
    .select("id, name, provider, thumbnail_url")
    .single();

  if (error) {
    return NextResponse.json(
      { error: `Erro ao guardar slot: ${getErrorMessage(error)}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ slot: data });
}
