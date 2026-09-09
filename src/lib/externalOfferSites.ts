export const DEFAULT_EXTERNAL_OFFER_SITE = {
  slug: "arena-dos-bonus",
  name: "Arena dos Bónus",
  title: "Ofertas da Arena dos Bónus",
  description:
    "Ofertas escolhidas e atualizadas através do painel Brutuspolus.",
  ctaLabel: "Apostar Agora",
} as const;

export const EXTERNAL_OFFER_SITE_SLUG_RE = /^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/;

export function isExternalOfferSiteSlug(value: unknown): value is string {
  return (
    typeof value === "string" &&
    EXTERNAL_OFFER_SITE_SLUG_RE.test(value.trim())
  );
}
