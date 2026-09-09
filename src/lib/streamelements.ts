const SE_API = "https://api.streamelements.com/kappa/v2";

export type StreamElementsUpdateResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string; status?: number; detail?: string };

export type StreamElementsPointsResult =
  | { ok: true; points: number | null; data: unknown }
  | { ok: false; points: null; error: string; status?: number; detail?: string };

function getHeaders() {
  const token = process.env.STREAMELEMENTS_JWT_TOKEN;
  if (!token) return null;

  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function getChannelId() {
  return process.env.STREAMELEMENTS_CHANNEL_ID || "";
}

export function hasStreamElementsConfig() {
  return Boolean(getHeaders() && getChannelId());
}

async function readResponse(res: Response) {
  const text = await res.text().catch(() => "");
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function streamElementsError(status: number) {
  if (status === 401) {
    return "StreamElements 401: token JWT inválido, expirado ou sem acesso ao canal";
  }

  if (status === 403) {
    return "StreamElements 403: token JWT sem permissão para alterar pontos";
  }

  return `Erro StreamElements ${status}`;
}

function readPoints(data: unknown): number | null {
  if (typeof data === "number" && Number.isFinite(data)) return data;
  if (!data || typeof data !== "object") return null;

  const root = data as Record<string, unknown>;
  if (typeof root.points === "number" && Number.isFinite(root.points)) {
    return root.points;
  }

  if (typeof root.points === "string") {
    const parsed = Number(root.points);
    if (Number.isFinite(parsed)) return parsed;
  }

  const user = root.user;
  if (user && typeof user === "object") {
    const userPoints = (user as Record<string, unknown>).points;
    if (typeof userPoints === "number" && Number.isFinite(userPoints)) {
      return userPoints;
    }
    if (typeof userPoints === "string") {
      const parsed = Number(userPoints);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return null;
}

export async function updateStreamElementsPoints(
  username: string,
  amount: number,
): Promise<StreamElementsUpdateResult> {
  const headers = getHeaders();
  const channelId = getChannelId();
  const safeUsername = username.trim();
  const safeAmount = Math.trunc(amount);

  if (!headers || !channelId) {
    return { ok: false, error: "StreamElements não configurado", status: 503 };
  }

  if (!safeUsername) {
    return { ok: false, error: "Utilizador StreamElements em falta", status: 400 };
  }

  if (!Number.isFinite(safeAmount) || safeAmount <= 0) {
    return { ok: false, error: "Valor de pontos inválido", status: 400 };
  }

  try {
    const res = await fetch(
      `${SE_API}/points/${channelId}/${encodeURIComponent(safeUsername)}/${safeAmount}`,
      { method: "PUT", headers },
    );
    const payload = await readResponse(res);

    if (!res.ok) {
      return {
        ok: false,
        error: streamElementsError(res.status),
        status: res.status,
        detail: typeof payload === "string" ? payload : JSON.stringify(payload),
      };
    }

    return { ok: true, data: payload };
  } catch (err) {
    return {
      ok: false,
      error: "Falha ao contactar StreamElements",
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function getStreamElementsPoints(
  username: string,
): Promise<StreamElementsPointsResult> {
  const headers = getHeaders();
  const channelId = getChannelId();
  const safeUsername = username.trim();

  if (!headers || !channelId) {
    return {
      ok: false,
      points: null,
      error: "StreamElements não configurado",
      status: 503,
    };
  }

  if (!safeUsername) {
    return {
      ok: false,
      points: null,
      error: "Utilizador StreamElements em falta",
      status: 400,
    };
  }

  try {
    const res = await fetch(
      `${SE_API}/points/${channelId}/${encodeURIComponent(safeUsername)}`,
      { headers, cache: "no-store" },
    );
    const payload = await readResponse(res);

    if (!res.ok) {
      return {
        ok: false,
        points: null,
        error: streamElementsError(res.status),
        status: res.status,
        detail: typeof payload === "string" ? payload : JSON.stringify(payload),
      };
    }

    return { ok: true, points: readPoints(payload), data: payload };
  } catch (err) {
    return {
      ok: false,
      points: null,
      error: "Falha ao contactar StreamElements",
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}
