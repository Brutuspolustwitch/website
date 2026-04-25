-- ============================================================
-- HALL OF VICTORS v3 — full rebuild
-- Run in Supabase SQL Editor.
-- Creates a clean, podium-driven victories pipeline:
--   submission -> moderation -> approval -> weekly winners.
-- ============================================================

-- ── 0. Helper: week_id (Sun 00:00 -> Sat 23:59) ─────────────
-- Returns the Sunday date of the week that contains the given timestamp.
-- This date acts as the canonical week_id (e.g. '2026-04-19').
create or replace function hov_week_id(ts timestamptz)
returns date language sql immutable as $$
  select (ts at time zone 'UTC')::date
       - (extract(dow from (ts at time zone 'UTC'))::int);
$$;

-- ── 1. Victories table ─────────────────────────────────────
create table if not exists hov_victories (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references users(id) on delete cascade,
  username        text        not null,
  avatar_url      text,
  slot_name       text        not null,
  provider        text        not null,
  bet_amount      numeric(14,2) not null check (bet_amount > 0),
  win_amount      numeric(14,2) not null check (win_amount >= 0),
  multiplier      numeric(14,2) not null check (multiplier >= 0),
  image_url       text        not null,
  caption         text,
  status          text        not null default 'pending'
                    check (status in ('pending','approved','rejected')),
  suspicious      boolean     not null default false,
  rejection_reason text,
  week_id         date        not null default hov_week_id(now()),
  created_at      timestamptz not null default now(),
  approved_at     timestamptz,
  approved_by     uuid        references users(id) on delete set null
);

create index if not exists hov_victories_status_idx     on hov_victories(status);
create index if not exists hov_victories_user_idx       on hov_victories(user_id, created_at desc);
create index if not exists hov_victories_week_idx       on hov_victories(week_id, status);
create index if not exists hov_victories_multiplier_idx on hov_victories(multiplier desc);
create index if not exists hov_victories_created_idx    on hov_victories(created_at desc);

-- ── 2. Weekly winners (frozen podium) ──────────────────────
create table if not exists hov_weekly_winners (
  id          uuid        primary key default gen_random_uuid(),
  week_id     date        not null,
  victory_id  uuid        not null references hov_victories(id) on delete cascade,
  rank        integer     not null check (rank between 1 and 3),
  frozen_at   timestamptz not null default now(),
  unique (week_id, rank),
  unique (week_id, victory_id)
);

create index if not exists hov_weekly_winners_week_idx on hov_weekly_winners(week_id desc, rank);

-- ── 3. RLS ─────────────────────────────────────────────────
alter table hov_victories       enable row level security;
alter table hov_weekly_winners  enable row level security;

-- Victories: anyone can read approved rows; user can read own pending/rejected.
do $$ begin
  if not exists (select 1 from pg_policies
    where tablename = 'hov_victories' and policyname = 'Public read approved hov_victories') then
    create policy "Public read approved hov_victories"
      on hov_victories for select
      using (status = 'approved');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies
    where tablename = 'hov_victories' and policyname = 'Service write hov_victories') then
    create policy "Service write hov_victories"
      on hov_victories for all
      using (true) with check (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies
    where tablename = 'hov_weekly_winners' and policyname = 'Public read hov_weekly_winners') then
    create policy "Public read hov_weekly_winners"
      on hov_weekly_winners for select
      using (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies
    where tablename = 'hov_weekly_winners' and policyname = 'Service write hov_weekly_winners') then
    create policy "Service write hov_weekly_winners"
      on hov_weekly_winners for all
      using (true) with check (true);
  end if;
end $$;

-- ── 4. Trigger: auto-fill week_id + suspicious + multiplier ─
create or replace function hov_normalize_victory()
returns trigger language plpgsql as $$
begin
  if new.bet_amount > 0 then
    new.multiplier := round(new.win_amount / new.bet_amount, 2);
  end if;
  if new.multiplier > 10000 then
    new.suspicious := true;
  end if;
  if new.week_id is null then
    new.week_id := hov_week_id(coalesce(new.created_at, now()));
  end if;
  return new;
end $$;

drop trigger if exists hov_normalize_victory_trg on hov_victories;
create trigger hov_normalize_victory_trg
  before insert on hov_victories
  for each row execute function hov_normalize_victory();

-- ── 5. Freeze weekly winners (callable from cron) ──────────
-- Computes top 3 approved victories for the given week and writes them
-- atomically. Idempotent: safe to call multiple times.
create or replace function hov_freeze_week(target_week date)
returns void language plpgsql security definer as $$
begin
  delete from hov_weekly_winners where week_id = target_week;
  insert into hov_weekly_winners (week_id, victory_id, rank)
  select target_week, v.id,
         row_number() over (order by v.multiplier desc, v.win_amount desc, v.created_at asc)
    from hov_victories v
   where v.status = 'approved'
     and v.week_id = target_week
   order by v.multiplier desc, v.win_amount desc, v.created_at asc
   limit 3;
end $$;
