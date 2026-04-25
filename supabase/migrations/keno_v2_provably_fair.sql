-- Keno v2: Full schema (create tables from scratch + provably fair)
-- Run this in the Supabase SQL editor before using the Keno feature.

-- 1. Create keno_games table
CREATE TABLE IF NOT EXISTS keno_games (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bet_amount       integer     NOT NULL,
  picks            integer[]   NOT NULL,
  drawn_numbers    integer[]   NOT NULL,
  matches          integer     NOT NULL,
  multiplier       integer     NOT NULL DEFAULT 0,
  result_amount    integer     NOT NULL DEFAULT 0,
  spots            integer,
  server_seed_hash text,
  client_seed      text,
  nonce            integer,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_keno_games_user
  ON keno_games (user_id, created_at DESC);

-- 2. Create keno_seeds table
CREATE TABLE IF NOT EXISTS keno_seeds (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  server_seed      text,
  server_seed_hash text        NOT NULL,
  client_seed      text        NOT NULL DEFAULT 'default',
  nonce            integer     NOT NULL DEFAULT 0,
  is_active        boolean     NOT NULL DEFAULT true,
  revealed_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_keno_seeds_user_active
  ON keno_seeds (user_id, is_active);
