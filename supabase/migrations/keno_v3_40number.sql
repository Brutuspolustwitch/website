-- Keno v3: Migrate to 40-number board
-- Run in Supabase SQL Editor AFTER keno_v2_provably_fair.sql

-- 1. result_amount can reach 50,000,000× × 1000 pts = 50,000,000,000
--    which overflows integer (max ~2.1B). Upgrade to bigint.
ALTER TABLE keno_games
  ALTER COLUMN result_amount TYPE bigint USING result_amount::bigint;

-- 2. Ensure spots column exists (added in v2, guard for older installs)
ALTER TABLE keno_games
  ADD COLUMN IF NOT EXISTS spots integer;

-- 3. RLS: allow users to read only their own games
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'keno_games' AND policyname = 'Users read own keno_games'
  ) THEN
    CREATE POLICY "Users read own keno_games"
      ON keno_games FOR SELECT
      USING (user_id = (
        SELECT id FROM users WHERE twitch_id = (
          current_setting('request.jwt.claims', true)::jsonb->>'sub'
        )
      ));
  END IF;
END $$;

-- 4. Service role insert policy (for API writes)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'keno_games' AND policyname = 'Service insert keno_games'
  ) THEN
    CREATE POLICY "Service insert keno_games"
      ON keno_games FOR INSERT WITH CHECK (true);
  END IF;
END $$;
