-- ============================================================
-- Arena Gladiator — Supabase Database Schema
-- Run this in Supabase SQL Editor to set up all tables.
-- ============================================================

-- Bonus Hunt Sessions
create table if not exists bonus_hunt_sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Bonus Hunt',
  status text not null default 'active' check (status in ('active', 'completed', 'upcoming')),
  total_buy numeric not null default 0,
  total_result numeric not null default 0,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Bonus Hunt Slots
create table if not exists bonus_hunt_slots (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references bonus_hunt_sessions(id) on delete cascade,
  name text not null,
  buy_value numeric not null default 0,
  potential_multiplier numeric not null default 0,
  result numeric,
  status text not null default 'pending' check (status in ('pending', 'active', 'completed')),
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_bonus_hunt_slots_session on bonus_hunt_slots(session_id);

-- Slot Requests
create table if not exists slot_requests (
  id uuid primary key default gen_random_uuid(),
  user_name text not null,
  slot_name text not null,
  status text not null default 'queued' check (status in ('queued', 'playing', 'done')),
  points_cost integer not null default 0,
  created_at timestamptz not null default now()
);

-- Leaderboard
create table if not exists leaderboard (
  id uuid primary key default gen_random_uuid(),
  user_name text not null unique,
  display_name text not null,
  avatar_url text,
  total_points integer not null default 0,
  biggest_win numeric not null default 0,
  rank text not null default 'recruit' check (rank in ('recruit', 'warrior', 'champion', 'legend')),
  created_at timestamptz not null default now()
);

create index idx_leaderboard_points on leaderboard(total_points desc);

-- Casino Affiliates (for CMS-driven casino pages)
create table if not exists casino_affiliates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  logo_url text,
  rating numeric not null default 0 check (rating >= 0 and rating <= 5),
  bonus_text text not null default '',
  bonus_details text not null default '',
  pros text[] not null default '{}',
  cons text[] not null default '{}',
  supported_countries text[] not null default '{}',
  affiliate_url text not null default '',
  review_body text not null default '',
  faq jsonb not null default '[]',
  created_at timestamptz not null default now()
);

-- Casino Offers (admin-managed partnerships)
create table if not exists casino_offers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  logo_url text,
  logo_bg text not null default '#666',
  banner_url text,
  badge text check (badge in ('NEW', 'HOT', null)),
  tags text[] not null default '{}',
  headline text not null,
  bonus_value text not null,
  free_spins text not null default '',
  min_deposit text not null,
  code text not null default '',
  cashback text,
  withdraw_time text not null default 'Up to 48h',
  license text not null default 'Curaçao',
  established text not null default '2023',
  notes text[] not null default '{}',
  affiliate_url text not null default '#',
  visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_casino_offers_visible on casino_offers(visible, sort_order);

-- Users (Twitch-authenticated, with roles)
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  twitch_id text not null unique,
  login text not null,
  display_name text not null,
  profile_image_url text,
  role text not null default 'viewer' check (role in ('admin', 'configurador', 'moderador', 'viewer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_users_twitch_id on users(twitch_id);

-- Enable Realtime for bonus hunt tracking
alter publication supabase_realtime add table bonus_hunt_slots;
alter publication supabase_realtime add table slot_requests;
alter publication supabase_realtime add table spin_history;

-- Row Level Security (RLS)
alter table bonus_hunt_sessions enable row level security;
alter table bonus_hunt_slots enable row level security;
alter table slot_requests enable row level security;
alter table leaderboard enable row level security;
alter table casino_affiliates enable row level security;

-- Public read access
create policy "Public read sessions" on bonus_hunt_sessions for select using (true);
create policy "Public read slots" on bonus_hunt_slots for select using (true);
create policy "Public read requests" on slot_requests for select using (true);
create policy "Public read leaderboard" on leaderboard for select using (true);
create policy "Public read casinos" on casino_affiliates for select using (true);

-- Insert policy for slot requests (anyone can request)
create policy "Anyone can request slots" on slot_requests for insert with check (true);

-- Spin history: public read + insert
alter table spin_history enable row level security;
create policy "Public read spin history" on spin_history for select using (true);
create policy "Anyone can insert spin history" on spin_history for insert with check (true);

-- Casino offers: public read, authenticated full access
alter table casino_offers enable row level security;
create policy "Public read visible offers" on casino_offers for select using (true);
create policy "Admin insert offers" on casino_offers for insert with check (true);
create policy "Admin update offers" on casino_offers for update using (true);
create policy "Admin delete offers" on casino_offers for delete using (true);

-- Users: public read, admin-only write
alter table users enable row level security;
create policy "Public read users" on users for select using (true);
create policy "Admin insert users" on users for insert with check (true);
create policy "Admin update users" on users for update using (true);
create policy "Admin delete users" on users for delete using (true);
