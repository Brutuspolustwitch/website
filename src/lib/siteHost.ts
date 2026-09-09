export const ARENA_SITE_NAME = "Arena dos Bónus";
export const ARENA_SITE_DESCRIPTION =
  "Ofertas de casino e bónus online selecionados para a comunidade Arena dos Bónus.";
export const ARENA_SITE_URL = "https://arenadosbonus.com";

const ARENA_HOSTS = new Set(["arenadosbonus.com", "www.arenadosbonus.com"]);

export function normalizeHost(value: string | null | undefined) {
  return (value ?? "")
    .split(",")[0]
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, "");
}

export function isArenaHost(value: string | null | undefined) {
  return ARENA_HOSTS.has(normalizeHost(value));
}
