import { supabase } from "@/lib/supabase";

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
  best_slot_name?: string;
  bestSlotName?: string;
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
}

function num(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizePhase(data: SourceBonusHunt, bonuses: SourceBonus[]) {
  const openedCount = bonuses.filter((b) => b.opened || b.isOpened).length;
  if (data.phase && ["hunting", "opening", "completed"].includes(data.phase)) return data.phase;
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

async function findSessionForUpsert(huntName: string, huntDate: string | null) {
  let exactQuery = supabase
    .from("bonus_hunt_sessions")
    .select("id")
    .eq("title", huntName)
    .order("created_at", { ascending: false })
    .limit(1);

  exactQuery = huntDate ? exactQuery.eq("hunt_date", huntDate) : exactQuery.is("hunt_date", null);

  const exact = await exactQuery.maybeSingle();
  if (exact.data?.id) return exact.data.id as string;

  const activeSameTitle = await supabase
    .from("bonus_hunt_sessions")
    .select("id")
    .eq("status", "active")
    .eq("title", huntName)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (activeSameTitle.data?.id) return activeSameTitle.data.id as string;

  if (huntDate) {
    const activeSameDate = await supabase
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

export async function importBonusHunt(
  data: SourceBonusHunt,
  options: ImportBonusHuntOptions = {}
): Promise<ImportBonusHuntResult> {
  const bonuses = data.bonuses || data.slots || data.items || [];
  if (!Array.isArray(bonuses) || bonuses.length === 0) {
    throw new Error("Nenhum bonus encontrado na resposta do overlay");
  }

  const huntName = data.hunt_name || data.huntName || data.name || "Bonus Hunt";
  const phase = normalizePhase(data, bonuses);
  const huntDate = normalizeHuntDate(data.hunt_date || data.huntDate || data.date);
  const openedCount = bonuses.filter((b) => b.opened || b.isOpened).length;
  const totalBuy = bonuses.reduce((sum, b) => sum + num(b.betSize ?? b.bet ?? b.buy), 0);
  const totalWin = num(data.total_win ?? data.totalWin);
  const startMoney = num(data.initial_buy ?? data.initialBuy ?? data.bankroll ?? data.start_money ?? data.startMoney);
  const stopLoss = num(data.stop_loss ?? data.stopLoss);

  const openedBuy = bonuses
    .filter((b) => b.opened || b.isOpened)
    .reduce((sum, b) => sum + num(b.betSize ?? b.bet ?? b.buy), 0);
  const actualCost = stopLoss > 0 ? startMoney - stopLoss : openedBuy;
  const profit = data.profit ?? (totalWin - actualCost);

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
    bonus_count: num(data.bonus_count ?? data.bonusCount ?? data.count, bonuses.length),
    bonuses_opened: num(data.bonuses_opened ?? data.bonusesOpened ?? data.opened, openedCount),
    avg_multi: num(data.avg_multi ?? data.avgMulti),
    best_multi: num(data.best_multi ?? data.bestMulti),
    best_slot_name: data.best_slot_name || data.bestSlotName || null,
    hunt_date: huntDate,
    completed_at: phase === "completed" ? new Date().toISOString() : null,
  };

  const existingSessionId = options.mode === "upsert-active"
    ? await findSessionForUpsert(huntName, huntDate)
    : null;

  let sessionId = existingSessionId;
  if (sessionId) {
    const { error } = await supabase
      .from("bonus_hunt_sessions")
      .update(sessionPayload)
      .eq("id", sessionId);
    if (error) throw new Error("Erro ao atualizar sessao: " + error.message);
    await supabase.from("bonus_hunt_slots").delete().eq("session_id", sessionId);
  } else {
    const { data: inserted, error } = await supabase
      .from("bonus_hunt_sessions")
      .insert(sessionPayload)
      .select("id")
      .single();
    if (error || !inserted) throw new Error("Erro ao criar sessao: " + (error?.message ?? "desconhecido"));
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
      potential_multiplier: num(b.slot?.max_win_multiplier ?? b.slot?.maxWin ?? b.max_win_multiplier),
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

  const { error: slotsError } = await supabase.from("bonus_hunt_slots").insert(slotRows);
  if (slotsError) {
    if (!existingSessionId) await supabase.from("bonus_hunt_sessions").delete().eq("id", sessionId);
    throw new Error("Erro ao inserir slots: " + slotsError.message);
  }

  return {
    sessionId,
    slotsImported: slotRows.length,
    huntName,
    phase,
    created: !existingSessionId,
  };
}
