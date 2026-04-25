import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import { parseClipUrl, sanitizeText, getVideoThumbnail } from "@/lib/clipParser";

export const dynamic = "force-dynamic";

const ALLOWED_PROVIDERS = ["Stake", "BC.Game", "Pragmatic", "Betano", "ESC Online", "Solverde", "Outro"] as const;
const PAGE_SIZE = 20;

/* ── Session helpers ─────────────────────────────────────────── */
async function getSession() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("twitch_session")?.value;
  if (!raw) return null;
  try { return JSON.parse(raw) as { id: string; login: string; display_name: string; profile_image_url: string }; }
  catch { return null; }
}

async function getModSession() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("twitch_session")?.value;
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as { id: string; login: string; role?: string };
    if (!["admin", "configurador", "moderador"].includes(s.role ?? "")) return null;
    return s;
  } catch { return null; }
}

/* ── Compute current ISO-week Monday 00:00 UTC ───────────────── */
function currentWeekStart(): string {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun … 6=Sat
  const daysFromMon = day === 0 ? 6 : day - 1;
  const mon = new Date(now);
  mon.setUTCDate(now.getUTCDate() - daysFromMon);
  mon.setUTCHours(0, 0, 0, 0);
  return mon.toISOString();
}

/* ── GET ─────────────────────────────────────────────────────── */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  /* ── ?top3=1 → top 3 of the current week by multiplier ────── */
  if (searchParams.get("top3") === "1") {
    const { data, error } = await supabase
      .from("user_clips")
      .select("*")
      .eq("status", "approved")
      .not("multiplier", "is", null)
      .gte("created_at", currentWeekStart())
      .order("multiplier", { ascending: false })
      .limit(3);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ wins: data ?? [] });
  }

  /* ── ?pending=1 → moderation queue (mod/admin only) ──────── */
  if (searchParams.get("pending") === "1") {
    const mod = await getModSession();
    if (!mod) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

    const { data, error } = await supabase
      .from("user_clips")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ clips: data ?? [] });
  }

  /* ── Default: public paginated feed (approved only) ─────────  */
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const sort = searchParams.get("sort") === "honors" ? "honors" : "created_at";

  const from = (page - 1) * PAGE_SIZE;
  const to   = from + PAGE_SIZE - 1;

  const { data, error, count } = await supabase
    .from("user_clips")
    .select("*", { count: "exact" })
    .eq("status", "approved")
    .order(sort, { ascending: false })
    .range(from, to);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    clips:    data ?? [],
    total:    count ?? 0,
    page,
    pageSize: PAGE_SIZE,
  });
}

/* ── POST — submit a new clip (auth required) ────────────────── */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Pedido inválido" }, { status: 400 }); }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
  }

  const { url, title, description, provider, slot_name, slot_thumbnail_url,
          multiplier_value, payout_value } = body as Record<string, unknown>;

  if (typeof url !== "string" || url.trim() === "") {
    return NextResponse.json({ error: "URL é obrigatório" }, { status: 400 });
  }

  const safeProvider = ALLOWED_PROVIDERS.includes(provider as typeof ALLOWED_PROVIDERS[number])
    ? (provider as string)
    : "Outro";

  const { type: embedType, embedUrl } = parseClipUrl(url);
  if (embedUrl === "#") {
    return NextResponse.json({ error: "URL inválido ou não suportado" }, { status: 400 });
  }

  const safeTitle       = sanitizeText(title, 120)       || "Vitória";
  const safeDescription = sanitizeText(description, 500) || "";
  const safeSlotName    = sanitizeText(slot_name, 120)   || null;

  const autoThumb    = getVideoThumbnail(embedType, embedUrl);
  const thumbnailUrl = autoThumb
    ?? (typeof slot_thumbnail_url === "string" && slot_thumbnail_url.startsWith("https://")
      ? slot_thumbnail_url.slice(0, 2048)
      : null);

  /* Parse numeric multiplier */
  const numMultiplier = typeof multiplier_value === "number" && isFinite(multiplier_value) && multiplier_value > 0
    ? multiplier_value
    : (() => {
        const m = String(safeDescription).match(/^(\d+(?:\.\d+)?)x$/i);
        return m ? parseFloat(m[1]) : null;
      })();

  const numPayout = typeof payout_value === "number" && isFinite(payout_value) && payout_value > 0
    ? payout_value
    : null;

  const { data, error } = await supabase
    .from("user_clips")
    .insert({
      twitch_id:     session.id,
      username:      session.login,
      avatar_url:    session.profile_image_url,
      title:         safeTitle,
      description:   safeDescription,
      url:           url.trim().slice(0, 2048),
      provider:      safeProvider,
      embed_type:    embedType,
      embed_url:     embedUrl,
      slot_name:     safeSlotName,
      thumbnail_url: thumbnailUrl,
      multiplier:    numMultiplier,
      payout_value:  numPayout,
      status:        "pending",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ clip: data }, { status: 201 });
}

/* ── PATCH — approve or reject a clip (mod/admin only) ───────── */
export async function PATCH(request: Request) {
  const mod = await getModSession();
  if (!mod) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Pedido inválido" }, { status: 400 }); }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
  }

  const { id, status } = body as Record<string, unknown>;

  if (typeof id !== "string" || !id.trim()) {
    return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
  }
  if (status !== "approved" && status !== "rejected") {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }

  const { error } = await supabase
    .from("user_clips")
    .update({ status })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
