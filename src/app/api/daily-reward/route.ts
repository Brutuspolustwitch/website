import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { notify } from "@/lib/notify";
import {
  getStreamElementsPoints,
  updateStreamElementsPoints,
} from "@/lib/streamelements";
import type {
  DailyRewardClaimRow,
  DailyRewardProfileRow,
  UserRow,
} from "@/lib/supabase";

export const dynamic = "force-dynamic";

const REWARD_STEPS = [50, 75, 100, 150, 200, 250, 500] as const;
const SEVEN_DAY_BONUS = 500;
const THIRTY_DAY_BONUS = 5000;
const CLAIM_LOCK_MS = 60_000;
const DAY_MS = 24 * 60 * 60 * 1000;

type Session = {
  id: string;
  login: string;
  display_name?: string;
  profile_image_url?: string | null;
  role?: string;
};

type ProfileUser = Pick<
  UserRow,
  "id" | "twitch_id" | "login" | "display_name" | "profile_image_url" | "se_username"
>;

type ProfileUserDbRow = ProfileUser & Record<string, unknown>;
type DailyRewardProfileDbRow = DailyRewardProfileRow & Record<string, unknown>;
type DailyRewardClaimDbRow = DailyRewardClaimRow & Record<string, unknown>;

type DailyRewardDatabase = {
  public: {
    Tables: {
      users: {
        Row: ProfileUserDbRow;
        Insert: Record<string, unknown> & {
          twitch_id: string;
          login: string;
          display_name: string;
          profile_image_url?: string | null;
        };
        Update: Record<string, unknown> & Partial<ProfileUser>;
        Relationships: [];
      };
      daily_reward_profiles: {
        Row: DailyRewardProfileDbRow;
        Insert: Record<string, unknown> & Partial<DailyRewardProfileRow> & {
          user_twitch_id: string;
          login: string;
        };
        Update: Record<string, unknown> & Partial<DailyRewardProfileRow>;
        Relationships: [];
      };
      daily_reward_claims: {
        Row: DailyRewardClaimDbRow;
        Insert: Record<string, unknown> & Partial<DailyRewardClaimRow> & {
          user_twitch_id: string;
          claim_date: string;
          streak_count: number;
          cycle_day: number;
          base_amount: number;
          multiplier: number;
          streak_bonus: number;
          total_amount: number;
          se_username: string;
        };
        Update: Record<string, unknown> & Partial<DailyRewardClaimRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      start_daily_reward_claim: {
        Args: {
          p_claim_id: string;
          p_processing_started_at: string;
          p_processing_cutoff: string;
        };
        Returns: DailyRewardClaimRow[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

type ServerSupabase = SupabaseClient<DailyRewardDatabase>;

type RewardPlan = {
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

function getServerSupabase(): ServerSupabase | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  return createClient<DailyRewardDatabase>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function parseSession(raw?: string): Session | null {
  if (!raw) return null;

  try {
    const session = JSON.parse(raw) as Partial<Session>;
    if (typeof session.id !== "string" || typeof session.login !== "string") {
      return null;
    }

    return {
      id: session.id,
      login: session.login,
      display_name: session.display_name,
      profile_image_url: session.profile_image_url,
      role: session.role,
    };
  } catch {
    return null;
  }
}

async function getSession() {
  const cookieStore = await cookies();
  return parseSession(cookieStore.get("twitch_session")?.value);
}

function utcDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function nextResetAtUtc(now = new Date()) {
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      0,
      0,
    ),
  ).toISOString();
}

function dateKeyToTime(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  if (!year || !month || !day) return Number.NaN;
  return Date.UTC(year, month - 1, day);
}

function dayDiff(fromDateKey: string, toDateKey: string) {
  return Math.round((dateKeyToTime(toDateKey) - dateKeyToTime(fromDateKey)) / DAY_MS);
}

function intValue(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.trunc(numeric) : fallback;
}

function rewardForStreak(streak: number, date: string): RewardPlan {
  const safeStreak = Math.max(1, Math.trunc(streak));
  const cycleDay = ((safeStreak - 1) % REWARD_STEPS.length) + 1;
  const baseAmount = REWARD_STEPS[cycleDay - 1] ?? REWARD_STEPS[0];
  const multiplier = safeStreak >= 8 ? 1.25 : 1;
  const multipliedBaseAmount = Math.round(baseAmount * multiplier);
  const streakBonus =
    (safeStreak % 7 === 0 ? SEVEN_DAY_BONUS : 0)
    + (safeStreak % 30 === 0 ? THIRTY_DAY_BONUS : 0);

  return {
    date,
    streak: safeStreak,
    cycleDay,
    week: Math.max(1, Math.ceil(safeStreak / REWARD_STEPS.length)),
    baseAmount,
    multipliedBaseAmount,
    multiplier,
    streakBonus,
    amount: multipliedBaseAmount + streakBonus,
  };
}

function nextReward(profile: DailyRewardProfileRow, today: string) {
  if (profile.last_claimed_date === today) {
    return rewardForStreak(Math.max(1, intValue(profile.current_streak, 1)), today);
  }

  const continuesStreak =
    profile.last_claimed_date && dayDiff(profile.last_claimed_date, today) === 1;
  const nextStreak = continuesStreak
    ? intValue(profile.current_streak, 0) + 1
    : 1;

  return rewardForStreak(nextStreak, today);
}

function rewardFromClaim(claim: DailyRewardClaimRow, today: string): RewardPlan {
  const streak = intValue(claim.streak_count, 1);
  const cycleDay = intValue(claim.cycle_day, 1);
  const baseAmount = intValue(claim.base_amount, 0);
  const multiplier = Number(claim.multiplier) || 1;
  const streakBonus = intValue(claim.streak_bonus, 0);
  const amount = intValue(claim.total_amount, 0);

  return {
    date: claim.claim_date || today,
    streak,
    cycleDay,
    week: Math.max(1, Math.ceil(streak / REWARD_STEPS.length)),
    baseAmount,
    multipliedBaseAmount: Math.max(0, amount - streakBonus),
    multiplier,
    streakBonus,
    amount,
  };
}

function isClaimProcessing(claim: DailyRewardClaimRow | null) {
  if (!claim?.processing_started_at || claim.se_awarded) return false;
  const startedAt = new Date(claim.processing_started_at).getTime();
  return Number.isFinite(startedAt) && Date.now() - startedAt < CLAIM_LOCK_MS;
}

async function getUser(db: ServerSupabase, session: Session): Promise<ProfileUser> {
  const { data, error } = await db
    .from("users")
    .select("id, twitch_id, login, display_name, profile_image_url, se_username")
    .eq("twitch_id", session.id)
    .maybeSingle<ProfileUser>();

  if (error) throw error;
  if (data) return data;

  const displayName = session.display_name || session.login;
  const { data: inserted, error: insertError } = await db
    .from("users")
    .insert({
      twitch_id: session.id,
      login: session.login,
      display_name: displayName,
      profile_image_url: session.profile_image_url || null,
    })
    .select("id, twitch_id, login, display_name, profile_image_url, se_username")
    .single<ProfileUser>();

  if (insertError || !inserted) {
    throw insertError ?? new Error("Utilizador não encontrado");
  }

  return inserted;
}

async function ensureProfile(db: ServerSupabase, session: Session) {
  const user = await getUser(db, session);
  const seUsername = user.se_username || user.login || session.login;

  const { data, error } = await db
    .from("daily_reward_profiles")
    .upsert(
      {
        user_twitch_id: session.id,
        user_id: user.id,
        login: user.login || session.login,
        se_username: seUsername,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_twitch_id" },
    )
    .select("*")
    .single<DailyRewardProfileRow>();

  if (error || !data) {
    throw error ?? new Error("Perfil de recompensa não encontrado");
  }

  return data;
}

async function getTodayClaim(db: ServerSupabase, userTwitchId: string, today: string) {
  const { data, error } = await db
    .from("daily_reward_claims")
    .select("*")
    .eq("user_twitch_id", userTwitchId)
    .eq("claim_date", today)
    .maybeSingle<DailyRewardClaimRow>();

  if (error) throw error;
  return data ?? null;
}

async function fetchBalance(seUsername: string) {
  const pointsResult = await getStreamElementsPoints(seUsername);
  return pointsResult.ok ? pointsResult.points : null;
}

async function buildState(
  session: Session,
  profile: DailyRewardProfileRow,
  claim: DailyRewardClaimRow | null,
) {
  const today = utcDateKey();
  const plannedReward = claim ? rewardFromClaim(claim, today) : nextReward(profile, today);
  const profileClaimedToday = profile.last_claimed_date === today;
  const alreadyClaimed = Boolean(claim?.se_awarded || profileClaimedToday);
  const pending = isClaimProcessing(claim);
  const canClaim = !alreadyClaimed && !pending;
  const seUsername = profile.se_username || session.login;
  const balance = await fetchBalance(seUsername);

  return {
    authenticated: true,
    user: {
      twitchId: session.id,
      login: session.login,
      seUsername,
    },
    canClaim,
    alreadyClaimed,
    pending,
    shouldPrompt: canClaim && profile.last_prompted_date !== today,
    today: plannedReward,
    profile: {
      currentStreak: intValue(profile.current_streak, 0),
      bestStreak: intValue(profile.best_streak, 0),
      totalClaimedPoints: intValue(profile.total_claimed_points, 0),
      lastClaimedDate: profile.last_claimed_date,
      lastPromptedDate: profile.last_prompted_date,
    },
    balance,
    nextResetAt: nextResetAtUtc(),
  };
}

async function loadContext() {
  const session = await getSession();
  if (!session) {
    return {
      response: NextResponse.json({ error: "Não autenticado" }, { status: 401 }),
    };
  }

  const db = getServerSupabase();
  if (!db) {
    return {
      response: NextResponse.json(
        { error: "Supabase service role não configurado" },
        { status: 503 },
      ),
    };
  }

  const profile = await ensureProfile(db, session);
  const today = utcDateKey();
  const claim = await getTodayClaim(db, session.id, today);

  return { db, session, profile, claim, today };
}

async function lockClaimForAward(db: ServerSupabase, claimId: string) {
  const now = new Date();
  const cutoff = new Date(now.getTime() - CLAIM_LOCK_MS);
  const { data, error } = await db.rpc("start_daily_reward_claim", {
    p_claim_id: claimId,
    p_processing_started_at: now.toISOString(),
    p_processing_cutoff: cutoff.toISOString(),
  });

  if (error) throw error;

  const rows = Array.isArray(data) ? data : data ? [data] : [];
  return (rows[0] as DailyRewardClaimRow | undefined) ?? null;
}

async function createClaim(
  db: ServerSupabase,
  session: Session,
  profile: DailyRewardProfileRow,
  today: string,
) {
  const plan = nextReward(profile, today);
  const { data, error } = await db
    .from("daily_reward_claims")
    .insert({
      user_twitch_id: session.id,
      user_id: profile.user_id,
      claim_date: today,
      streak_count: plan.streak,
      cycle_day: plan.cycleDay,
      base_amount: plan.baseAmount,
      multiplier: plan.multiplier,
      streak_bonus: plan.streakBonus,
      total_amount: plan.amount,
      se_username: profile.se_username || session.login,
    })
    .select("*")
    .single<DailyRewardClaimRow>();

  if (error) {
    if (error.code === "23505") {
      return getTodayClaim(db, session.id, today);
    }

    throw error;
  }

  return data;
}

export async function GET() {
  try {
    const context = await loadContext();
    if ("response" in context) return context.response;

    const state = await buildState(context.session, context.profile, context.claim);
    return NextResponse.json(state);
  } catch (err) {
    console.error("daily reward state failed:", err);
    return NextResponse.json(
      {
        error: "Erro ao carregar recompensa diária",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}

export async function PATCH() {
  try {
    const context = await loadContext();
    if ("response" in context) return context.response;

    const { data, error } = await context.db
      .from("daily_reward_profiles")
      .update({
        last_prompted_date: context.today,
        updated_at: new Date().toISOString(),
      })
      .eq("user_twitch_id", context.session.id)
      .select("*")
      .single<DailyRewardProfileRow>();

    if (error || !data) {
      throw error ?? new Error("Falha ao registar popup diário");
    }

    const state = await buildState(context.session, data, context.claim);
    return NextResponse.json(state);
  } catch (err) {
    console.error("daily reward prompt mark failed:", err);
    return NextResponse.json(
      {
        error: "Erro ao registar popup diário",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}

export async function POST() {
  try {
    const context = await loadContext();
    if ("response" in context) return context.response;

    let { claim } = context;
    const { db, session, today } = context;
    let { profile } = context;

    if (claim?.se_awarded || profile.last_claimed_date === today) {
      const state = await buildState(session, profile, claim);
      return NextResponse.json(state);
    }

    if (!claim) {
      claim = await createClaim(db, session, profile, today);
    }

    if (!claim) {
      return NextResponse.json(
        { error: "Não foi possível preparar a recompensa diária" },
        { status: 500 },
      );
    }

    const lockedClaim = await lockClaimForAward(db, claim.id);
    if (!lockedClaim) {
      const latestClaim = await getTodayClaim(db, session.id, today);
      const state = await buildState(session, profile, latestClaim);
      return NextResponse.json(state, { status: 202 });
    }

    const awardResult = await updateStreamElementsPoints(
      lockedClaim.se_username,
      intValue(lockedClaim.total_amount, 0),
    );

    if (!awardResult.ok) {
      await db
        .from("daily_reward_claims")
        .update({
          processing_started_at: null,
          se_error: awardResult.detail || awardResult.error,
        })
        .eq("id", lockedClaim.id);

      const latestClaim = await getTodayClaim(db, session.id, today);
      const state = await buildState(session, profile, latestClaim);
      return NextResponse.json(
        { ...state, error: awardResult.error },
        { status: awardResult.status ?? 502 },
      );
    }

    const awardedAt = new Date().toISOString();
    const { data: awardedClaim, error: awardSaveError } = await db
      .from("daily_reward_claims")
      .update({
        se_awarded: true,
        se_error: null,
        processing_started_at: null,
        awarded_at: awardedAt,
      })
      .eq("id", lockedClaim.id)
      .select("*")
      .single<DailyRewardClaimRow>();

    if (awardSaveError || !awardedClaim) {
      throw awardSaveError ?? new Error("Falha ao guardar recompensa atribuída");
    }

    const bestStreak = Math.max(
      intValue(profile.best_streak, 0),
      intValue(awardedClaim.streak_count, 1),
    );
    const totalClaimedPoints =
      intValue(profile.total_claimed_points, 0) + intValue(awardedClaim.total_amount, 0);

    const { data: updatedProfile, error: profileError } = await db
      .from("daily_reward_profiles")
      .update({
        current_streak: intValue(awardedClaim.streak_count, 1),
        best_streak: bestStreak,
        last_claimed_date: today,
        total_claimed_points: totalClaimedPoints,
        se_username: awardedClaim.se_username,
        updated_at: awardedAt,
      })
      .eq("user_twitch_id", session.id)
      .select("*")
      .single<DailyRewardProfileRow>();

    if (profileError || !updatedProfile) {
      throw profileError ?? new Error("Falha ao atualizar sequência diária");
    }

    profile = updatedProfile;

    await notify(
      session.id,
      "se_points_earned",
      "Recompensa diária recebida",
      `Ganhaste ${intValue(awardedClaim.total_amount, 0).toLocaleString("pt-PT")} pontos SE por entrares hoje no site.`,
    );

    const state = await buildState(session, profile, awardedClaim);
    return NextResponse.json({
      ...state,
      award: {
        amount: intValue(awardedClaim.total_amount, 0),
        seUsername: awardedClaim.se_username,
      },
    });
  } catch (err) {
    console.error("daily reward claim failed:", err);
    return NextResponse.json(
      {
        error: "Erro ao receber recompensa diária",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
