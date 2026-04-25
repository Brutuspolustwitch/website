import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;
const MAX_PER_DAY = 3;
const SUSPICIOUS_THRESHOLD = 10000;

type Session = {
  id: string;
  login: string;
  display_name: string;
  profile_image_url?: string;
  role?: string;
};

async function getSession(): Promise<Session | null> {
  const c = await cookies();
  const raw = c.get("twitch_session")?.value;
  if (!raw) return null;
  try { return JSON.parse(raw) as Session; } catch { return null; }
}

async function getModSession(): Promise<Session | null> {
  const s = await getSession();
  if (!s) return null;
  if (!["admin", "configurador", "moderador"].includes(s.role ?? "")) return null;
  return s;
}

/* Resolve internal users.id from twitch_id */
async function getUserDbId(twitchId: string): Promise<string | null> {
  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("twitch_id", twitchId)
    .maybeSingle();
  return data?.id ?? null;
}

function clampStr(v: unknown, max: number): string {
  return String(v ?? "").trim().slice(0, max);
}

function num(v: unknown): number | null {
  if (typeof v === "number" && isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(",", "."));
    return isFinite(n) ? n : null;
  }
  return null;
}

/* ── GET — public list with filters/sort, or moderation queue ── */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Moderation queue
  if (searchParams.get("pending") === "1") {
    const mod = await getModSession();
    if (!mod) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    const { data, error } = await supabase
      .from("hov_victories")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ victories: data ?? [] });
  }

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const sort = searchParams.get("sort") === "multiplier" ? "multiplier" : "created_at";
  const provider = searchParams.get("provider");
  const minMult = num(searchParams.get("min_multiplier"));
  const maxMult = num(searchParams.get("max_multiplier"));

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let q = supabase
    .from("hov_victories")
    .select("*", { count: "exact" })
    .eq("status", "approved")
    .order(sort, { ascending: false })
    .range(from, to);

  if (provider && provider !== "All") q = q.eq("provider", provider);
  if (minMult !== null) q = q.gte("multiplier", minMult);
  if (maxMult !== null) q = q.lte("multiplier", maxMult);

  const { data, error, count } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    victories: data ?? [],
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
  });
}

/* ── POST — submit a victory (auth required) ── */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const userId = await getUserDbId(session.id);
  if (!userId) return NextResponse.json({ error: "Utilizador não encontrado" }, { status: 404 });

  // Daily quota
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  const { count: todayCount, error: cntErr } = await supabase
    .from("hov_victories")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since.toISOString());
  if (cntErr) return NextResponse.json({ error: cntErr.message }, { status: 500 });
  if ((todayCount ?? 0) >= MAX_PER_DAY) {
    return NextResponse.json({ error: `Limite diário atingido (${MAX_PER_DAY}/dia).` }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try { body = (await request.json()) as Record<string, unknown>; }
  catch { return NextResponse.json({ error: "Pedido inválido" }, { status: 400 }); }

  const slot_name = clampStr(body.slot_name, 120);
  const provider = clampStr(body.provider, 60);
  const bet_amount = num(body.bet_amount);
  const win_amount = num(body.win_amount);
  const url = clampStr(body.url, 2048);
  const image_url = clampStr(body.image_url, 2048);
  const caption = clampStr(body.caption, 500);

  if (!slot_name) return NextResponse.json({ error: "Nome da slot obrigatório" }, { status: 400 });
  if (!provider) return NextResponse.json({ error: "Provedor obrigatório" }, { status: 400 });
  if (bet_amount === null || bet_amount <= 0) return NextResponse.json({ error: "Aposta inválida" }, { status: 400 });
  if (win_amount === null || win_amount < 0) return NextResponse.json({ error: "Ganho inválido" }, { status: 400 });
  if (!url || !/^https?:\/\//i.test(url)) {
    return NextResponse.json({ error: "Link da vitória obrigatório" }, { status: 400 });
  }

  const multiplier = Math.round((win_amount / bet_amount) * 100) / 100;
  const suspicious = multiplier > SUSPICIOUS_THRESHOLD;

  const { data, error } = await supabase
    .from("hov_victories")
    .insert({
      user_id: userId,
      username: session.display_name || session.login,
      avatar_url: session.profile_image_url ?? null,
      slot_name,
      provider,
      bet_amount,
      win_amount,
      multiplier,
      url,
      image_url: image_url || null,
      caption: caption || null,
      suspicious,
      status: "pending",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ victory: data }, { status: 201 });
}
