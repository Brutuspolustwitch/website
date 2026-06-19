import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { importBonusHunt, type SourceBonusHunt } from "@/lib/bonusHuntImport";

export const dynamic = "force-dynamic";

const DEFAULT_SECAADEGAS_API_URL = "https://osecaadegas.pt/api/streamer-data";

interface SessionCookie {
  role?: string;
}

function getSecaAdegasApiConfig() {
  const apiKey = process.env.SECAADEGAS_API_KEY || process.env.OVERLAY_API_KEY;
  if (!apiKey) {
    throw new Error("SECAADEGAS_API_KEY nao configurada no servidor");
  }

  const baseUrl = process.env.SECAADEGAS_API_URL || DEFAULT_SECAADEGAS_API_URL;
  const url = new URL(baseUrl);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("action", "bonus_hunt");
  return { url, apiKey };
}

async function fetchSecaAdegasData() {
  const { url, apiKey } = getSecaAdegasApiConfig();
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      "x-api-key": apiKey,
    },
  });
  if (!response.ok) {
    const body = (await response.text()).trim();
    const detail = body ? ` - ${body}` : "";
    throw new Error(`Seca Adegas API retornou ${response.status}: ${response.statusText}${detail}`);
  }
  return await response.json() as SourceBonusHunt;
}

async function syncBonusHunt() {
  const overlayData = await fetchSecaAdegasData();
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
      source: "secaadegas_api",
    });
  } catch (error) {
    return jsonError(error, 502);
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
      source: "secaadegas_api",
    });
  } catch (error) {
    return jsonError(error, 502);
  }
}
