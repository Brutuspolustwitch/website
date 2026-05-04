-- Add wager tracking columns to daily_sessions
-- wager_target: total wager requirement (€)
-- wager_done: wager completed so far (€)
-- Run this in Supabase SQL editor.

alter table daily_sessions
  add column if not exists wager_target numeric(12, 2) not null default 0,
  add column if not exists wager_done   numeric(12, 2) not null default 0;
