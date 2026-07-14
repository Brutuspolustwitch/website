import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { importBonusHunt, type SourceBonusHunt } from "@/lib/bonusHuntImport";
import {
  buildStreamersCenterApiUrl,
  getStreamersCenterApiKey,
  isStreamersCenterApiConfigError,
} from "@/lib/streamers-center-api";

export const dynamic = "force-dynamic";

interface SessionCookie {
  role?: string;
}

function getStreamersCenterBonusHuntConfig() {
  const apiKey = getStreamersCenterApiKey();
  const url = buildStreamersCenterApiUrl("/api/streamer-data", {
    key: apiKey,
    action: "bonus_hunt",
  });

  return { url, apiKey };
}

async function fetchStreamersCenterBonusHuntData() {
  const { url, apiKey } = getStreamersCenterBonusHuntConfig();
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "x-api-key": apiKey,
    },
  });

  if (!response.ok) {
    const body = (await response.text()).trim();
    const detail = body ? ` - ${body}` : "";
    throw new Error(`Streamers Center API retornou ${response.status}: ${response.statusText}${detail}`);
  }

  return await response.json() as SourceBonusHunt;
}

async function syncBonusHunt() {
  const overlayData = await fetchStreamersCenterBonusHuntData();
  return await importBonusHunt(overlayData, { mode: "upsert-active" });
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
      source: "streamers_center_api",
    });
  } catch (error) {
    return jsonError(error, isStreamersCenterApiConfigError(error) ? 500 : 502);
  }
}
