import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchAndImportFromStreamersCenter } from "@/lib/bonusHuntImport";
import { isStreamersCenterApiConfigError } from "@/lib/streamers-center-api";

export const dynamic = "force-dynamic";

interface SessionCookie {
  role?: string;
}

async function syncBonusHunt() {
  return await fetchAndImportFromStreamersCenter();
}


async function requireAdmin() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("twitch_session")?.value;

  if (!sessionCookie) return false;

  let session: SessionCookie;
  try {
    session = JSON.parse(sessionCookie);
  } catch {
    return false;
  }

  return session.role === "admin" || session.role === "configurador";
}

function isAuthorizedCron(request: NextRequest) {
  const secret = process.env.BONUS_HUNT_SYNC_SECRET || process.env.CRON_SECRET;
  if (!secret) return false;

  const bearer = request.headers.get("authorization");
  const apiKey = request.headers.get("x-api-key");
  const querySecret = request.nextUrl.searchParams.get("secret");

  return bearer === `Bearer ${secret}` || apiKey === secret || querySecret === secret;
}

function jsonError(error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : "Erro desconhecido";
  return NextResponse.json({ error: message }, { status });
}

export async function POST() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  try {
    const result = await syncBonusHunt();
    return NextResponse.json({
      success: true,
      session_id: result.sessionId,
      slots_imported: result.slotsImported,
      hunt_name: result.huntName,
      phase: result.phase,
      created: result.created,
      daily_session_updated: result.dailySession.updated,
      daily_session_id: result.dailySession.sessionId,
      daily_session_fields: result.dailySession.fields,
      daily_session_error: result.dailySession.error,
      source: "streamers_center_api",
    });
  } catch (error) {
    return jsonError(error, isStreamersCenterApiConfigError(error) ? 500 : 502);
  }
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  try {
    const result = await syncBonusHunt();
    return NextResponse.json({
      success: true,
      session_id: result.sessionId,
      slots_imported: result.slotsImported,
      hunt_name: result.huntName,
      phase: result.phase,
      created: result.created,
      daily_session_updated: result.dailySession.updated,
      daily_session_id: result.dailySession.sessionId,
      daily_session_fields: result.dailySession.fields,
      daily_session_error: result.dailySession.error,
      source: "streamers_center_api",
    });
  } catch (error) {
    return jsonError(error, isStreamersCenterApiConfigError(error) ? 500 : 502);
  }
}
