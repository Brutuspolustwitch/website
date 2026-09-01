import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  deleteIntegrationSetting,
  getIntegrationSetting,
  setIntegrationSetting,
} from "@/lib/integration-settings";
import { STREAMERS_CENTER_API_KEY_SETTING } from "@/lib/streamers-center-api";

export const dynamic = "force-dynamic";

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

function maskKey(value: string) {
  if (value.length <= 4) return "****";
  return `****${value.slice(-4)}`;
}

/** Never returns the raw key — only whether it's configured and a masked preview. */
export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const stored = await getIntegrationSetting(STREAMERS_CENTER_API_KEY_SETTING);
  if (stored) {
    return NextResponse.json({
      configured: true,
      source: "database",
      preview: maskKey(stored),
    });
  }

  const envValue = process.env.STREAMERS_CENTER_API_KEY?.trim();
  if (envValue) {
    return NextResponse.json({
      configured: true,
      source: "env",
      preview: maskKey(envValue),
    });
  }

  return NextResponse.json({
    configured: false,
    source: "none",
    preview: null,
  });
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const apiKey = typeof body?.apiKey === "string" ? body.apiKey.trim() : "";
  if (!apiKey) {
    return NextResponse.json(
      { error: "Chave da API em falta." },
      { status: 400 },
    );
  }

  try {
    await setIntegrationSetting(STREAMERS_CENTER_API_KEY_SETTING, apiKey);
    return NextResponse.json({
      configured: true,
      source: "database",
      preview: maskKey(apiKey),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Clears the database override, falling back to the STREAMERS_CENTER_API_KEY env var (if set). */
export async function DELETE() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  await deleteIntegrationSetting(STREAMERS_CENTER_API_KEY_SETTING);
  return NextResponse.json({ success: true });
}
