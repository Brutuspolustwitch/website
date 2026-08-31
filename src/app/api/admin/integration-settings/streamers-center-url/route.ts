import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  deleteIntegrationSetting,
  getIntegrationSetting,
  setIntegrationSetting,
} from "@/lib/integration-settings";
import {
  isStreamersCenterApiConfigError,
  normalizeStreamersCenterApiOrigin,
  STREAMERS_CENTER_API_URL_SETTING,
} from "@/lib/streamers-center-api";

export const dynamic = "force-dynamic";

const DEFAULT_ORIGIN = "https://streamerscenter.com";

async function requireAdmin() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("twitch_session")?.value;
  if (!raw) return false;
  try {
    const session = JSON.parse(raw);
    return session.role === "admin" || session.role === "configurador";
  } catch {
    return false;
  }
}

/** The origin isn't a secret, so the effective value is returned as-is (unlike the API key). */
export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const stored = await getIntegrationSetting(STREAMERS_CENTER_API_URL_SETTING);
  if (stored) {
    return NextResponse.json({ configured: true, source: "database", value: stored });
  }

  const envValue = process.env.STREAMERS_CENTER_API_URL?.trim();
  if (envValue) {
    return NextResponse.json({ configured: true, source: "env", value: envValue });
  }

  return NextResponse.json({ configured: true, source: "default", value: DEFAULT_ORIGIN });
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const rawUrl = typeof body?.apiUrl === "string" ? body.apiUrl.trim() : "";
  if (!rawUrl) {
    return NextResponse.json({ error: "URL em falta." }, { status: 400 });
  }

  try {
    const normalized = normalizeStreamersCenterApiOrigin(rawUrl);
    await setIntegrationSetting(STREAMERS_CENTER_API_URL_SETTING, normalized);
    return NextResponse.json({ configured: true, source: "database", value: normalized });
  } catch (error) {
    const status = isStreamersCenterApiConfigError(error) ? 400 : 500;
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status });
  }
}

/** Clears the database override, falling back to the env var or the known default origin. */
export async function DELETE() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  await deleteIntegrationSetting(STREAMERS_CENTER_API_URL_SETTING);
  return NextResponse.json({ success: true });
}
