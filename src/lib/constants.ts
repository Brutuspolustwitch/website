/* Site-wide constants */

export const SITE_NAME = "BRUTUSPOLUS";
export const SITE_DESCRIPTION =
  "BRUTUSPOLUS e a sua arena de iGaming em Portugal: streams ao vivo, bonus hunts, ofertas de casino, giveaways, rankings e comunidade.";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.brutuspolus.com";
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
