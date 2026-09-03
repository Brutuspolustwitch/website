import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  buildStreamersCenterApiUrl,
  getStreamersCenterApiKey,
} from "@/lib/streamers-center-api";

// bonus_hunt_sessions / bonus_hunt_slots only have "public read" RLS policies —
// writes must go through the service role client (the anon client is rejected by RLS).
// Created lazily (not at module scope) so builds/pages that never call this
// don't crash when the service role key isn't set in that environment.
let cachedClient: SupabaseClient | null = null;
function supabase() {
  if (cachedClient) return cachedClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY (and NEXT_PUBLIC_SUPABASE_URL) are required for bonus hunt imports.",
    );
  }
  cachedClient = createClient(url, key);
  return cachedClient;
}

export interface SourceBonus {
  id?: string | number;
  slotName?: string;
  name?: string;
  betSize?: number;
  bet?: number;
  buy?: number;
  opened?: boolean;
  isOpened?: boolean;
  result?: number;
  win?: number;
  payout?: number;
  isSuperBonus?: boolean;
  isExtremeBonus?: boolean;
  slot?: {
    name?: string;
    image?: string;
    provider?: string;
    rtp?: number | null;
    volatility?: string | null;
    max_win_multiplier?: number | null;
    maxWin?: number | null;
  };
  image?: string;
  provider?: string;
  rtp?: number | null;
  volatility?: string | null;
  max_win_multiplier?: number | null;
}

export interface SourceDailySession {
  deposits?: number;
  deposit?: number;
  total_deposits?: number;
  totalDeposits?: number;
  withdrawals?: number;
  withdrawal?: number;
  total_withdrawals?: number;
  totalWithdrawals?: number;
  bonuses_count?: number;
  bonusesCount?: number;
  biggest_win?: number;
  biggestWin?: number;
  wager_target?: number;
  wagerTarget?: number;
  wager_done?: number;
  wagerDone?: number;
}

export interface SourceBonusHunt {
  hunt_name?: string;
  huntName?: string;
  name?: string;
  phase?: "hunting" | "opening" | "completed";
  status?: string;
  currency?: string;
  hunt_date?: string;
  huntDate?: string;
  date?: string;
  start_money?: number;
  startMoney?: number;
  initial_buy?: number;
  initialBuy?: number;
  bankroll?: number;
  stop_loss?: number;
  stopLoss?: number;
  total_win?: number;
  totalWin?: number;
  profit?: number;
  bonus_count?: number;
  bonusCount?: number;
  count?: number;
  bonuses_opened?: number;
  bonusesOpened?: number;
  opened?: number;
  avg_multi?: number;
  avgMulti?: number;
  best_multi?: number;
  bestMulti?: number;
  break_even?: number;
  breakEven?: number;
  live_be?: number;
  liveBe?: number;
  live_break_even?: number;
  liveBreakEven?: number;
  best_slot_name?: string;
  bestSlotName?: string;
  daily_session?: SourceDailySession;
  dailySession?: SourceDailySession;
  deposits?: number;
  deposit?: number;
  total_deposits?: number;
  totalDeposits?: number;
  withdrawals?: number;
  withdrawal?: number;
  total_withdrawals?: number;
  totalWithdrawals?: number;
  bonuses_count?: number;
  bonusesCount?: number;
  biggest_win?: number;
  biggestWin?: number;
  wager_target?: number;
  wagerTarget?: number;
  wager_done?: number;
  wagerDone?: number;
  bonuses?: SourceBonus[];
  slots?: SourceBonus[];
  items?: SourceBonus[];
}

export interface ImportBonusHuntOptions {
  mode?: "insert" | "upsert-active";
}

export interface ImportBonusHuntResult {
  sessionId: string;
  slotsImported: number;
  huntName: string;
  phase: "hunting" | "opening" | "completed";
  created: boolean;
  dailySession: {
    updated: boolean;
    sessionId: string | null;
    fields: string[];
    error?: string;
  };
}

function num(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizePhase(data: SourceBonusHunt, bonuses: SourceBonus[]) {
  const openedCount = bonuses.filter((b) => b.opened || b.isOpened).length;
  if (data.phase && ["hunting", "opening", "completed"].includes(data.phase))
    return data.phase;
  if (data.status === "completed") return "completed";
  if (openedCount === 0) return "hunting";
  if (openedCount < bonuses.length) return "opening";
  return "completed";
}

function normalizeHuntDate(value: string | undefined) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toISOString().slice(0, 10);
}

function optionalNum(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function firstNumber(...values: unknown[]) {
  for (const value of values) {
    const n = optionalNum(value);
    if (n !== null) return n;
  }
  return null;
}

// B.E. = multiplier needed on ALL bonuses to hit the target; Live B.E. = multiplier needed
// on the REMAINING (unopened) bonuses only. Mirrors the streamerscenter.com widget's calc.
function calcBreakEven(
  bonuses: SourceBonus[],
  startMoney: number,
  stopLoss: number,
  totalBuy: number,
  totalWin: number,
) {
  const target = Math.max(startMoney - stopLoss, 0);
  const breakEven = totalBuy > 0 ? target / totalBuy : 0;
  const remainingBuy = bonuses
    .filter((b) => !(b.opened || b.isOpened))
    .reduce((sum, b) => sum + num(b.betSize ?? b.bet ?? b.buy), 0);
  const remainingTarget = Math.max(target - totalWin, 0);
  const liveBreakEven = remainingBuy > 0 ? remainingTarget / remainingBuy : 0;
  return { breakEven, liveBreakEven };
}

async function findSessionForUpsert(huntName: string, huntDate: string | null) {
  const db = supabase();
  let exactQuery = db
    .from("bonus_hunt_sessions")
    .select("id")
    .eq("title", huntName)
    .order("created_at", { ascending: false })
    .limit(1);

  exactQuery = huntDate
    ? exactQuery.eq("hunt_date", huntDate)
    : exactQuery.is("hunt_date", null);

  const exact = await exactQuery.maybeSingle();
  if (exact.data?.id) return exact.data.id as string;

  const activeSameTitle = await db
    .from("bonus_hunt_sessions")
    .select("id")
    .eq("status", "active")
    .eq("title", huntName)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (activeSameTitle.data?.id) return activeSameTitle.data.id as string;

  if (huntDate) {
    const activeSameDate = await db
      .from("bonus_hunt_sessions")
      .select("id")
      .eq("status", "active")
      .eq("hunt_date", huntDate)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (activeSameDate.data?.id) return activeSameDate.data.id as string;
  }

  return null;
}

async function findDailySessionForSync(huntDate: string | null) {
  const db = supabase();
  const active = await db
    .from("daily_sessions")
    .select("id")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (active.error) throw active.error;
  if (active.data?.id) return active.data.id as string;

  if (!huntDate) return null;

  const sameDate = await db
    .from("daily_sessions")
    .select("id")
    .eq("session_date", huntDate)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sameDate.error) throw sameDate.error;
  return (sameDate.data?.id as string | undefined) ?? null;
}

async function syncDailySessionFromBonusHunt(
  data: SourceBonusHunt,
  huntDate: string | null,
  bonusCount: number,
  slotRows: Array<{ opened: boolean; payout: number | null; result: number | null }>,
): Promise<ImportBonusHuntResult["dailySession"]> {
  let dailySessionId: string | null = null;
  try {
    dailySessionId = await findDailySessionForSync(huntDate);
  } catch (error) {
    return {
      updated: false,
      sessionId: null,
      fields: [],
      error:
        error instanceof Error
          ? error.message
          : "Erro ao procurar sessao do dia.",
    };
  }

  if (!dailySessionId) {
    return { updated: false, sessionId: null, fields: [] };
  }

  const daily = data.daily_session ?? data.dailySession ?? {};
  const biggestSlotPayout = slotRows.reduce((max, slot) => {
    if (!slot.opened) return max;
    return Math.max(max, optionalNum(slot.payout ?? slot.result) ?? 0);
  }, 0);

  const patch: Record<string, number | string> = {
    bonuses_count: Math.max(
      0,
      Math.round(
        firstNumber(daily.bonuses_count, daily.bonusesCount, data.bonuses_count, data.bonusesCount) ??
          bonusCount,
      ),
    ),
    biggest_win:
      firstNumber(daily.biggest_win, daily.biggestWin, data.biggest_win, data.biggestWin) ??
      biggestSlotPayout,
    updated_at: new Date().toISOString(),
  };

  const deposits = firstNumber(
    daily.deposits,
    daily.deposit,
    daily.total_deposits,
    daily.totalDeposits,
    data.deposits,
    data.deposit,
    data.total_deposits,
    data.totalDeposits,
  );
  if (deposits !== null) patch.deposits = deposits;

  const withdrawals = firstNumber(
    daily.withdrawals,
    daily.withdrawal,
    daily.total_withdrawals,
    daily.totalWithdrawals,
    data.withdrawals,
    data.withdrawal,
    data.total_withdrawals,
    data.totalWithdrawals,
  );
  if (withdrawals !== null) patch.withdrawals = withdrawals;

  const wagerTarget = firstNumber(
    daily.wager_target,
    daily.wagerTarget,
    data.wager_target,
    data.wagerTarget,
  );
  if (wagerTarget !== null) patch.wager_target = wagerTarget;

  const wagerDone = firstNumber(
    daily.wager_done,
    daily.wagerDone,
    data.wager_done,
    data.wagerDone,
  );
  if (wagerDone !== null) patch.wager_done = wagerDone;

  const { error } = await supabase()
    .from("daily_sessions")
    .update(patch)
    .eq("id", dailySessionId);

  const fields = Object.keys(patch).filter((field) => field !== "updated_at");
  if (error) {
    return {
      updated: false,
      sessionId: dailySessionId,
      fields,
      error: error.message,
    };
  }

  return { updated: true, sessionId: dailySessionId, fields };
}

export async function importBonusHunt(
  data: SourceBonusHunt,
  options: ImportBonusHuntOptions = {},
): Promise<ImportBonusHuntResult> {
  const bonuses = data.bonuses || data.slots || data.items || [];
  if (!Array.isArray(bonuses) || bonuses.length === 0) {
    throw new Error("Nenhum bonus encontrado na resposta do overlay");
  }

  const huntName = data.hunt_name || data.huntName || data.name || "Bonus Hunt";
  const phase = normalizePhase(data, bonuses);
  const huntDate = normalizeHuntDate(
    data.hunt_date || data.huntDate || data.date,
  );
  const openedCount = bonuses.filter((b) => b.opened || b.isOpened).length;
  const totalBuy = bonuses.reduce(
    (sum, b) => sum + num(b.betSize ?? b.bet ?? b.buy),
    0,
  );
  const totalWin = num(data.total_win ?? data.totalWin);
  const startMoney = num(
    data.initial_buy ??
      data.initialBuy ??
      data.bankroll ??
      data.start_money ??
      data.startMoney,
  );
  const stopLoss = num(data.stop_loss ?? data.stopLoss);

  const openedBuy = bonuses
    .filter((b) => b.opened || b.isOpened)
    .reduce((sum, b) => sum + num(b.betSize ?? b.bet ?? b.buy), 0);
  const actualCost = stopLoss > 0 ? startMoney - stopLoss : openedBuy;
  const profit = data.profit ?? totalWin - actualCost;

  const { breakEven, liveBreakEven } = calcBreakEven(
    bonuses,
    startMoney,
    stopLoss,
    totalBuy,
    totalWin,
  );

  const sessionPayload = {
    title: huntName,
    status: phase === "completed" ? "completed" : "active",
    phase,
    currency: data.currency ?? "\u20ac",
    total_buy: totalBuy,
    total_result: totalWin,
    start_money: startMoney,
    stop_loss: stopLoss,
    profit,
    bonus_count: num(
      data.bonus_count ?? data.bonusCount ?? data.count,
      bonuses.length,
    ),
    bonuses_opened: num(
      data.bonuses_opened ?? data.bonusesOpened ?? data.opened,
      openedCount,
    ),
    avg_multi: num(data.avg_multi ?? data.avgMulti),
    best_multi: num(data.best_multi ?? data.bestMulti),
    break_even: num(data.break_even ?? data.breakEven, breakEven),
    live_break_even: num(
      data.live_be ?? data.liveBe ?? data.live_break_even ?? data.liveBreakEven,
      liveBreakEven,
    ),
    best_slot_name: data.best_slot_name || data.bestSlotName || null,
    hunt_date: huntDate,
    completed_at: phase === "completed" ? new Date().toISOString() : null,
  };

  const existingSessionId =
    options.mode === "upsert-active"
      ? await findSessionForUpsert(huntName, huntDate)
      : null;

  const db = supabase();
  let sessionId = existingSessionId;
  if (sessionId) {
    const { error } = await db
      .from("bonus_hunt_sessions")
      .update(sessionPayload)
      .eq("id", sessionId);
    if (error) throw new Error("Erro ao atualizar sessao: " + error.message);
    await db.from("bonus_hunt_slots").delete().eq("session_id", sessionId);
  } else {
    const { data: inserted, error } = await db
      .from("bonus_hunt_sessions")
      .insert(sessionPayload)
      .select("id")
      .single();
    if (error || !inserted)
      throw new Error(
        "Erro ao criar sessao: " + (error?.message ?? "desconhecido"),
      );
    sessionId = inserted.id as string;
  }

  const slotRows = bonuses.map((b, i) => {
    const isOpened = b.opened || b.isOpened || false;
    const slotName = b.slotName || b.name || b.slot?.name || "Unknown";
    const betSize = num(b.betSize ?? b.bet ?? b.buy);
    const payout = b.payout ?? b.win ?? b.result ?? null;

    return {
      session_id: sessionId,
      name: slotName,
      provider: b.slot?.provider || b.provider || null,
      buy_value: betSize,
      potential_multiplier: num(
        b.slot?.max_win_multiplier ?? b.slot?.maxWin ?? b.max_win_multiplier,
      ),
      result: isOpened ? payout : null,
      bet_size: betSize,
      rtp: b.slot?.rtp ?? b.rtp ?? null,
      volatility: b.slot?.volatility || b.volatility || null,
      is_super_bonus: b.isSuperBonus ?? false,
      is_extreme_bonus: b.isExtremeBonus ?? false,
      opened: isOpened,
      payout: isOpened ? payout : null,
      thumbnail_url: b.slot?.image || b.image || null,
      status: isOpened ? "completed" : "pending",
      order_index: i,
    };
  });

  const { error: slotsError } = await db
    .from("bonus_hunt_slots")
    .insert(slotRows);
  if (slotsError) {
    if (!existingSessionId)
      await db.from("bonus_hunt_sessions").delete().eq("id", sessionId);
    throw new Error("Erro ao inserir slots: " + slotsError.message);
  }

  const dailySession = await syncDailySessionFromBonusHunt(
    data,
    huntDate,
    Number(sessionPayload.bonus_count) || slotRows.length,
    slotRows,
  );

  return {
    sessionId,
    slotsImported: slotRows.length,
    huntName,
    phase,
    created: !existingSessionId,
    dailySession,
  };
}

/** Pulls the current bonus hunt state from the Streamers Center overlay API and upserts it. */
export async function fetchAndImportFromStreamersCenter() {
  const apiKey = await getStreamersCenterApiKey();
  const url = await buildStreamersCenterApiUrl("/api/streamer-data", {
    key: apiKey,
    action: "bonus_hunt",
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  let overlayData: SourceBonusHunt;
  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "x-api-key": apiKey,
      },
    });

    if (!response.ok) {
      const body = (await response.text()).trim();
      const detail = body ? ` - ${body}` : "";
      throw new Error(
        `Streamers Center API retornou ${response.status}: ${response.statusText}${detail}`,
      );
    }

    overlayData = (await response.json()) as SourceBonusHunt;
  } finally {
    clearTimeout(timeout);
  }

  return await importBonusHunt(overlayData, { mode: "upsert-active" });
}
