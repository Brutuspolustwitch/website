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
  image_url: string;
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
  current_week: string;
  live_top3: Victory[];
  frozen: { week_id: string; victories: Victory[] } | null;
}

export const PROVIDERS = [
  "Pragmatic", "Hacksaw", "Nolimit City", "Push Gaming", "Stake Originals",
  "Play'n GO", "Relax Gaming", "Big Time Gaming", "ELK Studios", "Outro",
] as const;
