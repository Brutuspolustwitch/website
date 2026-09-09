export type VictoryStatus = "pending" | "approved" | "rejected";

export interface Victory {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string | null;
  slot_name: string;
  provider: string;
  bet_amount: number;
  win_amount: number;
  multiplier: number;
  url?: string | null;
  image_url?: string | null;
  caption?: string | null;
  status: VictoryStatus;
  suspicious: boolean;
  rejection_reason?: string | null;
  week_id: string;
  created_at: string;
  approved_at?: string | null;
  rank?: number;
}

export interface WinnersResponse {
  current_month: string;
  month_start: string;
  month_end: string;
  month_top3: Victory[];
  live_top3?: Victory[];
  frozen: { week_id: string; victories: Victory[] } | null;
}

export const PROVIDERS = [
  "Pragmatic", "Hacksaw", "Nolimit City", "Push Gaming", "Stake Originals",
  "Play'n GO", "Relax Gaming", "Big Time Gaming", "ELK Studios", "Outro",
] as const;
