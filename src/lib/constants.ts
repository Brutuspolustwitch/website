/* Site-wide constants */

export const SITE_NAME = "Arena dos Bónus";
export const SITE_DESCRIPTION =
  "Ofertas de casino e bónus online selecionados para a comunidade Arena dos Bónus.";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://arenadosbonus.com";
export const TWITCH_CHANNEL = process.env.NEXT_PUBLIC_TWITCH_CHANNEL || "brutuspolus";

export const NAV_LINKS = [
  { href: "/sobre", label: "Sobre" },
  { href: "/ofertas", label: "Ofertas" },
  { href: "/destaques", label: "Destaques" },
  { href: "/stream", label: "Stream" },
  { href: "/liga-dos-brutus", label: "Liga dos Brutus" },
  { href: "/hall-of-victories", label: "Bruta do Mês" },
  { href: "/loja", label: "Loja" },
] as const;
