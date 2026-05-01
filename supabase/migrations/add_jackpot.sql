-- Jackpot for Adivinha o Resultado
-- Starts at 30€, increments by 1€ on each bonus hunt import,
-- resets to 30€ when a user guesses the exact total payout.

create table if not exists jackpot (
  id int primary key default 1,
  amount numeric not null default 30,
  updated_at timestamptz not null default now(),
  constraint jackpot_single_row check (id = 1)
);

-- Seed the single row
insert into jackpot (id, amount) values (1, 30)
on conflict (id) do nothing;

-- Enable realtime so the UI can subscribe
alter publication supabase_realtime add table jackpot;

-- Update notifications check constraint to include jackpot_win
alter table notifications
  drop constraint if exists notifications_type_check;

alter table notifications
  add constraint notifications_type_check
  check (type in ('giveaway_win', 'guess_result_win', 'general', 'jackpot_win'));
