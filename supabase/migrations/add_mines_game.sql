-- Mines game table
create table if not exists mines_games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  bet_amount integer not null,
  mine_count integer not null,
  mine_positions jsonb not null default '[]'::jsonb,
  revealed_cells jsonb not null default '[]'::jsonb,
  multiplier numeric(10,2) not null default 1.0,
  status text not null default 'active' check (status in ('active', 'won', 'lost', 'forfeited')),
  result_amount integer,
  created_at timestamptz not null default now(),
  ended_at timestamptz
);

-- Index for fast user+status lookups
create index if not exists mines_games_user_status on mines_games(user_id, status);

-- RLS
alter table mines_games enable row level security;

create policy "Anyone can read mines_games" on mines_games for select using (true);
create policy "Anyone can insert mines_games" on mines_games for insert with check (true);
create policy "Anyone can update mines_games" on mines_games for update using (true);
