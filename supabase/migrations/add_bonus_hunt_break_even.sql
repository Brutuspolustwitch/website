-- Live break-even stats from the Streamers Center bonus hunt overlay (B.E. display).
-- break_even = overall multiplier needed across ALL bonuses to reach the target (start - stop loss).
-- live_break_even = multiplier needed on the REMAINING unopened bonuses only (updates as bonuses open).
alter table bonus_hunt_sessions
  add column if not exists break_even numeric not null default 0,
  add column if not exists live_break_even numeric not null default 0;
