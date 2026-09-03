import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import {
  BONUS_HUNT_DISPLAY_TARGETS,
  isBonusHuntDisplayTarget,
  type BonusHuntDisplayTarget,
} from "@/lib/bonusHuntDisplay";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type DisplayMap = Partial<Record<BonusHuntDisplayTarget, string>>;

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL are required for bonus hunt display settings.",
    );
  }
  return createClient(url, key);
}

async function requireStaff() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("twitch_session")?.value;

  if (!sessionCookie) return false;

  let session: { role?: string };
  try {
    session = JSON.parse(sessionCookie);
  } catch {
    return false;
  }

  return ["admin", "configurador", "moderador"].includes(session.role ?? "");
}

export async function GET() {
  const [displayRes, dailySessionRes] = await Promise.all([
    supabase
      .from("bonus_hunt_page_display")
      .select("target, session_id, updated_at"),
    supabase
      .from("daily_sessions")
      .select("id")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle(),
  ]);

  const display: DisplayMap = {};
  for (const row of displayRes.data ?? []) {
    if (isBonusHuntDisplayTarget(row.target)) {
      display[row.target] = row.session_id;
    }
  }

  return NextResponse.json({
    display,
    targets: BONUS_HUNT_DISPLAY_TARGETS,
    active_daily_session: Boolean(dailySessionRes.data?.id),
    active_daily_session_id: dailySessionRes.data?.id ?? null,
    error: displayRes.error?.message ?? null,
  });
}

export async function PATCH(request: Request) {
  if (!(await requireStaff())) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    target?: unknown;
    sessionId?: unknown;
  } | null;

  if (!body || !isBonusHuntDisplayTarget(body.target)) {
    return NextResponse.json({ error: "Destino invalido" }, { status: 400 });
  }

  if (typeof body.sessionId !== "string" || !UUID_RE.test(body.sessionId)) {
    return NextResponse.json({ error: "Bonus hunt invalido" }, { status: 400 });
  }

  const db = getServiceRoleClient();
  const { data: hunt, error: huntError } = await db
    .from("bonus_hunt_sessions")
    .select("id")
    .eq("id", body.sessionId)
    .maybeSingle();

  if (huntError) {
    return NextResponse.json({ error: huntError.message }, { status: 500 });
  }

  if (!hunt) {
    return NextResponse.json(
      { error: "Bonus hunt nao encontrado" },
      { status: 404 },
    );
  }

  const { data, error } = await db
    .from("bonus_hunt_page_display")
    .upsert(
      {
        target: body.target,
        session_id: body.sessionId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "target" },
    )
    .select("target, session_id, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ display: data });
}
