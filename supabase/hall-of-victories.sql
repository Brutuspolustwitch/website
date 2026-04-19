-- ============================================================
-- HALL OF VICTORIES — run this in the Supabase SQL Editor
-- ============================================================

-- ── 1. Clips table ───────────────────────────────────────────
create table if not exists user_clips (
  id          uuid        primary key default gen_random_uuid(),
  twitch_id   text        not null,
  username    text        not null,
  avatar_url  text,
  title       text        not null default 'Vitória',
  description text,
  url         text        not null,
  provider    text,
  embed_type  text        not null check (embed_type in ('video','iframe','link')),
  embed_url   text        not null,
  honors      integer     not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists user_clips_twitch_id_idx  on user_clips(twitch_id);
create index if not exists user_clips_created_at_idx on user_clips(created_at desc);
create index if not exists user_clips_honors_idx     on user_clips(honors desc);

-- ── 2. Honor ledger (prevents double-voting) ─────────────────
create table if not exists clip_honors (
  id               uuid        primary key default gen_random_uuid(),
  clip_id          uuid        not null references user_clips(id) on delete cascade,
  user_twitch_id   text        not null,
  created_at       timestamptz not null default now(),
  unique (clip_id, user_twitch_id)
);

create index if not exists clip_honors_clip_id_idx on clip_honors(clip_id);

-- ── 3. RLS policies ──────────────────────────────────────────
alter table user_clips  enable row level security;
alter table clip_honors enable row level security;

-- Anyone can read clips
create policy "Public read user_clips"
  on user_clips for select
  using (true);

-- Service role inserts (API handles auth — no Supabase Auth needed)
create policy "Service insert user_clips"
  on user_clips for insert
  with check (true);

-- Anyone can read honors
create policy "Public read clip_honors"
  on clip_honors for select
  using (true);

-- Service role manages honors
create policy "Service insert clip_honors"
  on clip_honors for insert
  with check (true);

create policy "Service delete clip_honors"
  on clip_honors for delete
  using (true);

-- ── 4. Atomic increment / decrement functions ─────────────────
create or replace function increment_clip_honors(clip_id_arg uuid)
returns void language sql security definer as $$
  update user_clips set honors = honors + 1 where id = clip_id_arg;
$$;

create or replace function decrement_clip_honors(clip_id_arg uuid)
returns void language sql security definer as $$
  update user_clips set honors = greatest(0, honors - 1) where id = clip_id_arg;
$$;
