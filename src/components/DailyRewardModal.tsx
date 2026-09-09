"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock3,
  Coins,
  Gift,
  Lock,
  Trophy,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const REWARD_STEPS = [50, 75, 100, 150, 200, 250, 500] as const;

type DailyRewardState = {
  authenticated: true;
  user: {
    twitchId: string;
    login: string;
    seUsername: string;
  };
  canClaim: boolean;
  alreadyClaimed: boolean;
  pending: boolean;
  today: {
    date: string;
    streak: number;
    cycleDay: number;
    week: number;
    baseAmount: number;
    multipliedBaseAmount: number;
    multiplier: number;
    streakBonus: number;
    amount: number;
  };
  profile: {
    currentStreak: number;
    bestStreak: number;
    totalClaimedPoints: number;
    lastClaimedDate: string | null;
  };
  balance: number | null;
  nextResetAt: string;
  award?: {
    amount: number;
    seUsername: string;
  };
  error?: string;
};

function formatPoints(value: number) {
  return Math.round(value).toLocaleString("pt-PT");
}

function formatMultiplier(value: number) {
  return `x${value.toLocaleString("pt-PT", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatCountdown(resetAt: string, now: number) {
  const target = new Date(resetAt).getTime();
  const remaining = Math.max(0, target - now);
  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);

  return [hours, minutes, seconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}

function dismissedKey(state: DailyRewardState) {
  return `brutuspolus:daily-reward:dismissed:${state.user.twitchId}:${state.today.date}`;
}

function daysUntil(streak: number, target: number) {
  const mod = streak % target;
  return mod === 0 ? 0 : target - mod;
}

function bonusCopy(days: number) {
  if (days === 0) return "hoje";
  return `em ${days} ${days === 1 ? "dia" : "dias"}`;
}

function rewardStatus(
  day: number,
  state: DailyRewardState,
): "done" | "today" | "locked" {
  if (day < state.today.cycleDay) return "done";
  if (day === state.today.cycleDay) {
    return state.alreadyClaimed ? "done" : "today";
  }
  return "locked";
}

export function DailyRewardModal() {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<DailyRewardState | null>(null);
  const [open, setOpen] = useState(false);
  const [loadingState, setLoadingState] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const loadReward = useCallback(async () => {
    if (authLoading || !user) return;

    setLoadingState(true);
    setError(null);

    try {
      const res = await fetch("/api/daily-reward", { cache: "no-store" });
      if (res.status === 401) {
        setState(null);
        setOpen(false);
        return;
      }

      const data = (await res.json()) as DailyRewardState;
      if (!res.ok) {
        throw new Error(data.error || "Não foi possível carregar a recompensa.");
      }

      setState(data);
      if (data.canClaim) {
        const dismissed = localStorage.getItem(dismissedKey(data));
        setOpen(dismissed !== "true");
      } else {
        setOpen(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar recompensa.");
    } finally {
      setLoadingState(false);
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setState(null);
      setOpen(false);
      return;
    }

    void loadReward();
  }, [authLoading, user, loadReward]);

  useEffect(() => {
    if (!open) return;

    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [open]);

  const close = useCallback(() => {
    if (state) {
      try {
        localStorage.setItem(dismissedKey(state), "true");
      } catch {
        // ignore storage failures
      }
    }
    setOpen(false);
  }, [state]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close, open]);

  const claimReward = useCallback(async () => {
    if (!state || !state.canClaim || claiming) return;

    setClaiming(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/daily-reward", { method: "POST" });
      const data = (await res.json()) as DailyRewardState;

      if (!res.ok) {
        if (data?.authenticated) setState(data);
        throw new Error(data.error || "Não foi possível atribuir os pontos.");
      }

      setState(data);
      if (data.pending && !data.award) {
        setMessage("A tua recompensa está a ser processada.");
        return;
      }

      setMessage(`Recebeste ${formatPoints(data.award?.amount ?? data.today.amount)} SE.`);

      window.dispatchEvent(
        new CustomEvent("se-points-updated", {
          detail: {
            points: typeof data.balance === "number" ? data.balance : undefined,
            delta: data.award?.amount ?? data.today.amount,
          },
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao receber recompensa.");
    } finally {
      setClaiming(false);
    }
  }, [claiming, state]);

  const rewardCards = useMemo(() => {
    if (!state) return [];

    return REWARD_STEPS.map((amount, index) => {
      const day = index + 1;
      return {
        day,
        amount,
        status: rewardStatus(day, state),
      };
    });
  }, [state]);

  if (!open || !state || loadingState) return null;

  const sevenDayDistance = daysUntil(state.today.streak, 7);
  const thirtyDayDistance = daysUntil(state.today.streak, 30);
  const claimDisabled = claiming || !state.canClaim;
  const claimLabel = state.alreadyClaimed
    ? "Recebido hoje"
    : state.pending
      ? "A processar"
      : `Receber ${formatPoints(state.today.amount)} SE`;

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="daily-reward-title"
    >
      <button
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        aria-label="Fechar recompensa diária"
        onClick={close}
        type="button"
      />

      <section className="relative w-full max-w-[640px] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border border-arena-gold/25 bg-[#151515] shadow-[0_30px_90px_rgba(0,0,0,0.75)]">
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_50%_0%,rgba(212,168,67,0.18),transparent_42%)]" />

        <div className="relative p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-arena-gold/25 bg-arena-gold/10 text-arena-gold">
                <Gift className="h-5 w-5" />
              </div>
              <h2
                id="daily-reward-title"
                className="text-lg font-bold text-arena-white"
              >
                Recompensa diária
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-bold text-arena-white sm:flex">
                <Coins className="h-4 w-4 text-arena-gold" />
                {typeof state.balance === "number"
                  ? `${formatPoints(state.balance)} SE`
                  : "SE"}
              </div>
              <button
                className="flex h-11 w-11 items-center justify-center rounded-full border border-arena-gold/70 text-arena-gold transition-colors hover:bg-arena-gold/10"
                aria-label="Fechar recompensa diária"
                onClick={close}
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="mt-7 grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <p className="text-sm text-arena-smoke">Recompensa de hoje</p>
              <div className="mt-1 flex items-end gap-3">
                <span className="text-6xl font-bold leading-none text-white">
                  {formatPoints(state.today.amount)}
                </span>
                <span className="pb-2 text-xl font-bold text-arena-gold">SE</span>
              </div>
              {state.today.streakBonus > 0 && (
                <p className="mt-2 text-sm text-arena-gold-light">
                  Inclui +{formatPoints(state.today.streakBonus)} SE de bónus.
                </p>
              )}
            </div>

            <div className="text-left sm:text-right">
              <p className="text-sm text-arena-smoke">Sequência</p>
              <p className="mt-1 text-4xl font-bold leading-none text-arena-gold-light">
                {state.today.streak}
                <span className="ml-2 text-base text-arena-gold">
                  {state.today.streak === 1 ? "dia" : "dias"}
                </span>
              </p>
              <p className="mt-2 text-xs text-arena-smoke">
                Melhor: {state.profile.bestStreak}
              </p>
            </div>
          </div>

          <div className="my-6 h-px bg-white/10" />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-arena-smoke">
              Dia {state.today.cycleDay} de 7 · Semana {state.today.week}
            </p>
            <div className="flex items-center gap-2 text-sm text-arena-smoke">
              <Clock3 className="h-4 w-4 text-arena-gold/70" />
              Reinicia em{" "}
              <span className="font-mono font-bold text-arena-gold-light">
                {formatCountdown(state.nextResetAt, now)}
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 min-[460px]:grid-cols-4 sm:grid-cols-7">
            {rewardCards.map((reward) => {
              const isToday = reward.status === "today";
              const isDone = reward.status === "done";
              const isLocked = reward.status === "locked";

              return (
                <div
                  key={reward.day}
                  className={`flex min-h-[126px] flex-col items-center justify-between rounded-lg border px-2 py-3 text-center transition-colors ${
                    isToday
                      ? "border-arena-gold bg-arena-gold/15 text-arena-gold-light shadow-[0_0_20px_rgba(212,168,67,0.16)]"
                      : isDone
                        ? "border-white/10 bg-white/[0.04] text-arena-smoke"
                        : "border-white/10 bg-black/20 text-arena-ash"
                  }`}
                >
                  <span className="text-xs">Dia {reward.day}</span>
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full border ${
                      isToday
                        ? "border-arena-gold bg-arena-gold/30 text-arena-gold-light"
                        : "border-white/10 bg-white/[0.06] text-arena-smoke"
                    }`}
                  >
                    {reward.day === 7 ? (
                      <Trophy className="h-5 w-5" />
                    ) : (
                      <Coins className="h-5 w-5" />
                    )}
                  </div>
                  <strong
                    className={`text-base ${isLocked ? "text-arena-smoke" : "text-white"}`}
                  >
                    +{formatPoints(reward.amount)}
                  </strong>
                  <span className="flex items-center gap-1 text-[11px] text-arena-smoke">
                    {isDone && <Check className="h-3 w-3 text-arena-gold" />}
                    {isLocked && <Lock className="h-3 w-3" />}
                    {isToday ? "Hoje" : isDone ? "Feito" : "Bloqueado"}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-6">
            <p className="text-sm text-arena-smoke">Bónus de sequência</p>
            <div className="mt-3 overflow-hidden rounded-lg border border-white/10 bg-white/[0.035]">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3">
                <div>
                  <p className="font-bold text-arena-white">Bónus 7 dias</p>
                  <p className="text-xs text-arena-smoke">
                    {bonusCopy(sevenDayDistance)}
                  </p>
                </div>
                <strong className="text-arena-gold-light">
                  +{formatPoints(500)} SE
                </strong>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3">
                <div>
                  <p className="font-bold text-arena-white">Bónus 30 dias</p>
                  <p className="text-xs text-arena-smoke">
                    {bonusCopy(thirtyDayDistance)}
                  </p>
                </div>
                <strong className="text-arena-gold-light">
                  +{formatPoints(5000)} SE
                </strong>
              </div>
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <div>
                  <p className="font-bold text-arena-white">Multiplicador diário</p>
                  <p className="text-xs text-arena-smoke">x1.25 a partir do dia 8</p>
                </div>
                <strong className="text-arena-gold-light">
                  {formatMultiplier(state.today.multiplier)}
                </strong>
              </div>
            </div>
          </div>

          {(error || message) && (
            <div
              className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
                error
                  ? "border-red-500/30 bg-red-950/30 text-red-200"
                  : "border-emerald-500/25 bg-emerald-950/25 text-emerald-200"
              }`}
            >
              {error || message}
            </div>
          )}

          <div className="mt-6 border-t border-white/10 pt-5">
            <button
              type="button"
              onClick={claimReward}
              disabled={claimDisabled}
              className="flex w-full items-center justify-center gap-3 rounded-lg bg-gradient-to-r from-arena-gold-light to-arena-gold px-5 py-4 text-sm font-black uppercase tracking-wider text-black transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
            >
              {claiming ? "A atribuir pontos..." : claimLabel}
              {!claiming && !state.alreadyClaimed && <ArrowRight className="h-4 w-4" />}
            </button>
            <p className="mt-4 text-center text-xs leading-relaxed text-arena-smoke">
              Uma recompensa por dia. Reinicia às 00:00 UTC. Se falhares um dia,
              a sequência volta ao dia 1. Os pontos ganhos ficam contigo.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
