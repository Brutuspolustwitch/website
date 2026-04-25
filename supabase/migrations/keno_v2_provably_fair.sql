-- Keno v2: Provably Fair upgrade
-- Run this in the Supabase SQL editor before deploying the new code.

-- 1. Add provably-fair columns to existing keno_games table
ALTER TABLE keno_games
  ADD COLUMN IF NOT EXISTS spots             integer,
  ADD COLUMN IF NOT EXISTS server_seed_hash  text,
  ADD COLUMN IF NOT EXISTS client_seed       text,
  ADD COLUMN IF NOT EXISTS nonce             integer;

-- 2. Create keno_seeds table
CREATE TABLE IF NOT EXISTS keno_seeds (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  server_seed      text,                        -- NULL until revealed after rotation
  server_seed_hash text        NOT NULL,
  client_seed      text        NOT NULL DEFAULT 'default',
  nonce            integer     NOT NULL DEFAULT 0,
  is_active        boolean     NOT NULL DEFAULT true,
  revealed_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_keno_seeds_user_active
  ON keno_seeds (user_id, is_active);
