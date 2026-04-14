import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabase = createClient(supabaseUrl || "https://placeholder.supabase.co", supabaseAnonKey || "placeholder");

/* ── Database Types ──────────────────────────────────────────────────
   These mirror the Supabase tables used by the arena platform.
   bonus_hunts: tracks active/past bonus hunt sessions
   slot_requests: user-submitted slot requests via !sr
   leaderboard: gladiator rank progression
──────────────────────────────────────────────────────────────────── */

export interface BonusHuntSlot {
  id: string;
  name: string;
  buy_value: number;
  potential_multiplier: number;
  result?: number;
  status: "pending" | "active" | "completed";
  order_index: number;
  session_id: string;
  created_at: string;
}

export interface SlotRequest {
  id: string;
  user_name: string;
  slot_name: string;
  status: "queued" | "playing" | "done";
  points_cost: number;
  created_at: string;
}

export interface LeaderboardEntry {
  id: string;
  user_name: string;
  display_name: string;
  avatar_url?: string;
  total_points: number;
  biggest_win: number;
  rank: "recruit" | "warrior" | "champion" | "legend";
  created_at: string;
}

export interface CasinoAffiliate {
  id: string;
  slug: string;
  name: string;
  logo_url: string;
  rating: number;
  bonus_text: string;
  bonus_details: string;
  pros: string[];
  cons: string[];
  supported_countries: string[];
  affiliate_url: string;
  review_body: string;
  faq: { question: string; answer: string }[];
  created_at: string;
}

export interface SpinHistoryRow {
  id: string;
  player: string;
  reward: string;
  icon: string;
  color: string;
  tier: string;
  created_at: string;
}
