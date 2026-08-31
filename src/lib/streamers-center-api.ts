import { getIntegrationSetting } from "@/lib/integration-settings";

const LEGACY_API_HOSTS = new Set(["osecaadegas.pt", "www.osecaadegas.pt"]);

export const STREAMERS_CENTER_API_KEY_SETTING = "streamers_center_api_key";
export const STREAMERS_CENTER_API_URL_SETTING = "streamers_center_api_url";
const DEFAULT_STREAMERS_CENTER_API_ORIGIN = "https://streamerscenter.com";

export class StreamersCenterApiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StreamersCenterApiConfigError";
  }
}

function assertValidStreamersCenterOrigin(url: URL) {
  if (!["https:", "http:"].includes(url.protocol)) {
    throw new StreamersCenterApiConfigError(
      "STREAMERS_CENTER_API_URL must start with https://."
    );
  }

  if (url.protocol === "http:" && !["localhost", "127.0.0.1"].includes(url.hostname)) {
    throw new StreamersCenterApiConfigError(
      "STREAMERS_CENTER_API_URL must use https outside local development."
    );
  }

  if (LEGACY_API_HOSTS.has(url.hostname.toLowerCase())) {
    throw new StreamersCenterApiConfigError(
      "STREAMERS_CENTER_API_URL must point to https://streamerscenter.com, not the old domain."
    );
  }

  if (url.pathname !== "/" || url.search || url.hash) {
    throw new StreamersCenterApiConfigError(
      "STREAMERS_CENTER_API_URL must be an origin only, for example https://streamerscenter.com."
    );
  }
}

export function normalizeStreamersCenterApiOrigin(rawOrigin: string | undefined) {
  const trimmed = rawOrigin?.trim().replace(/\/+$/, "");
  if (!trimmed) {
    throw new StreamersCenterApiConfigError(
      "STREAMERS_CENTER_API_URL is required for external Streamers Center API calls."
    );
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new StreamersCenterApiConfigError(
      "STREAMERS_CENTER_API_URL must be a valid absolute URL."
    );
  }

  assertValidStreamersCenterOrigin(url);
  return url.origin;
}

/** Prefers the URL saved via the admin UI (database), then the env var, then the known default origin. */
export async function getStreamersCenterApiOrigin() {
  const stored = await getIntegrationSetting(STREAMERS_CENTER_API_URL_SETTING);
  const rawOrigin = stored ?? process.env.STREAMERS_CENTER_API_URL ?? DEFAULT_STREAMERS_CENTER_API_ORIGIN;
  return normalizeStreamersCenterApiOrigin(rawOrigin);
}

/** Prefers the key saved via the admin UI (database) over the STREAMERS_CENTER_API_KEY env var. */
export async function getStreamersCenterApiKey() {
  const stored = await getIntegrationSetting(STREAMERS_CENTER_API_KEY_SETTING);
  const apiKey = (stored ?? process.env.STREAMERS_CENTER_API_KEY)?.trim();
  if (!apiKey) {
    throw new StreamersCenterApiConfigError(
      "STREAMERS_CENTER_API_KEY is required for the bonus hunt Streamers Center sync."
    );
  }
  return apiKey;
}

export async function buildStreamersCenterApiUrl(
  pathname: `/${string}`,
  searchParams: Record<string, string | number | boolean | null | undefined> = {}
) {
  const url = new URL(pathname, await getStreamersCenterApiOrigin());

  for (const [key, value] of Object.entries(searchParams)) {
    if (value === null || value === undefined || value === "") continue;
    url.searchParams.set(key, String(value));
  }

  return url;
}

export function isStreamersCenterApiConfigError(error: unknown) {
  return error instanceof StreamersCenterApiConfigError;
}
