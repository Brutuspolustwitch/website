-- Daily login StreamElements rewards

create table if not exists daily_reward_profiles (
  user_twitch_id text primary key references users(twitch_id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  login text not null,
  se_username text,
  current_streak integer not null default 0 check (current_streak >= 0),
  best_streak integer not null default 0 check (best_streak >= 0),
  last_claimed_date date,
  total_claimed_points integer not null default 0 check (total_claimed_points >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists daily_reward_claims (
  id uuid primary key default gen_random_uuid(),
  user_twitch_id text not null references daily_reward_profiles(user_twitch_id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  claim_date date not null,
  streak_count integer not null check (streak_count > 0),
  cycle_day smallint not null check (cycle_day between 1 and 7),
  base_amount integer not null check (base_amount >= 0),
  multiplier numeric(5, 2) not null default 1.00 check (multiplier >= 1.00),
  streak_bonus integer not null default 0 check (streak_bonus >= 0),
  total_amount integer not null check (total_amount >= 0),
  se_username text not null,
  se_awarded boolean not null default false,
  se_error text,
  processing_started_at timestamptz,
  created_at timestamptz not null default now(),
  awarded_at timestamptz,
  unique (user_twitch_id, claim_date)
);

create index if not exists idx_daily_reward_claims_user_created
  on daily_reward_claims(user_twitch_id, created_at desc);

create index if not exists idx_daily_reward_claims_claim_date
  on daily_reward_claims(claim_date desc);

alter table daily_reward_profiles enable row level security;
alter table daily_reward_claims enable row level security;

create or replace function start_daily_reward_claim(
  p_claim_id uuid,
  p_processing_started_at timestamptz,
  p_processing_cutoff timestamptz
)
returns setof daily_reward_claims
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update daily_reward_claims
     set processing_started_at = p_processing_started_at,
         se_error = null
   where id = p_claim_id
     and se_awarded = false
     and (
       processing_started_at is null
       or processing_started_at < p_processing_cutoff
     )
   returning *;
end;
$$;

revoke execute on function start_daily_reward_claim(uuid, timestamptz, timestamptz) from public;
revoke execute on function start_daily_reward_claim(uuid, timestamptz, timestamptz) from anon;
revoke execute on function start_daily_reward_claim(uuid, timestamptz, timestamptz) from authenticated;
grant execute on function start_daily_reward_claim(uuid, timestamptz, timestamptz) to service_role;

comment on table daily_reward_profiles is 'Current daily login reward streaks for Twitch users.';
comment on table daily_reward_claims is 'One daily login reward claim per Twitch user per UTC day.';
