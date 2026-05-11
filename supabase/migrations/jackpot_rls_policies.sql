-- Fix jackpot RLS: allow public reads, service-role writes
-- The table may or may not have RLS enabled; make it explicit.

ALTER TABLE jackpot ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read the jackpot value (public display)
DROP POLICY IF EXISTS "Public read jackpot" ON jackpot;
CREATE POLICY "Public read jackpot"
  ON jackpot FOR SELECT
  USING (true);

-- Allow service role (API routes) to update
DROP POLICY IF EXISTS "Service role update jackpot" ON jackpot;
CREATE POLICY "Service role update jackpot"
  ON jackpot FOR UPDATE
  TO service_role
  USING (true);
