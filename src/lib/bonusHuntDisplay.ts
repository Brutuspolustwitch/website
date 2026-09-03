export const BONUS_HUNT_DISPLAY_TARGETS = [
  "bonus_hunt",
  "adivinha_o_resultado",
  "daily_session",
] as const;

export type BonusHuntDisplayTarget = (typeof BONUS_HUNT_DISPLAY_TARGETS)[number];

export const BONUS_HUNT_DISPLAY_LABELS: Record<BonusHuntDisplayTarget, string> = {
  bonus_hunt: "Bonus Hunt",
  adivinha_o_resultado: "Adivinha",
  daily_session: "Sessão do Dia",
};

export function isBonusHuntDisplayTarget(
  value: unknown,
): value is BonusHuntDisplayTarget {
  return (
    typeof value === "string" &&
    BONUS_HUNT_DISPLAY_TARGETS.includes(value as BonusHuntDisplayTarget)
  );
}
