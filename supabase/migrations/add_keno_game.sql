-- Keno game table
create table if not exists keno_games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  bet_amount integer not null,
  picks jsonb not null default '[]'::jsonb,
  drawn_numbers jsonb not null default '[]'::jsonb,
  matches integer not null default 0,
  multiplier numeric(10,2) not null default 0,
  result_amount integer not null default 0,
  created_at timestamptz not null default now()
);

-- Index for fast user lookups
create index if not exists keno_games_user_id on keno_games(user_id);
create index if not exists keno_games_created_at on keno_games(created_at desc);

-- RLS
alter table keno_games enable row level security;

create policy "Anyone can read keno_games" on keno_games for select using (true);
create policy "Anyone can insert keno_games" on keno_games for insert with check (true);
