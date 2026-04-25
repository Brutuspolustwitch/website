-- Hall of Victories v2 — Moderation + Weekly Top 3
-- Run in Supabase SQL Editor after hall-of-victories.sql

-- 1. Add moderation status, numeric multiplier and payout to user_clips
ALTER TABLE user_clips
  ADD COLUMN IF NOT EXISTS status       text,
  ADD COLUMN IF NOT EXISTS multiplier   numeric,
  ADD COLUMN IF NOT EXISTS payout_value numeric;

-- 2. Mark ALL existing clips as approved (they were visible before)
UPDATE user_clips SET status = 'approved' WHERE status IS NULL;

-- 3. Enforce NOT NULL + default 'pending' for new rows
ALTER TABLE user_clips
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'pending';

-- 4. Check constraint
ALTER TABLE user_clips DROP CONSTRAINT IF EXISTS user_clips_status_check;
ALTER TABLE user_clips ADD CONSTRAINT user_clips_status_check
  CHECK (status IN ('pending', 'approved', 'rejected'));

-- 5. Backfill multiplier from description field (e.g. "2500x" -> 2500)
UPDATE user_clips
  SET multiplier = (regexp_match(description, '^(\d+(?:\.\d+)?)x'))[1]::numeric
  WHERE description ~* '^\d+(\.\d+)?x$'
    AND multiplier IS NULL
    AND status = 'approved';

-- 6. Indexes
CREATE INDEX IF NOT EXISTS user_clips_status_created_idx
  ON user_clips (status, created_at DESC);

CREATE INDEX IF NOT EXISTS user_clips_approved_multi_idx
  ON user_clips (multiplier DESC NULLS LAST)
  WHERE status = 'approved';

-- 7. Allow service role to UPDATE (approve / reject)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_clips' AND policyname = 'Service update user_clips'
  ) THEN
    CREATE POLICY "Service update user_clips"
      ON user_clips FOR UPDATE USING (true);
  END IF;
END $$;
