-- ============================================================
-- Adivinha o Resultado — Guess The Spoils Predictions
-- Run this in Supabase SQL Editor
-- ============================================================

-- Guess sessions (one per bonus hunt session)
CREATE TABLE IF NOT EXISTS guess_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bonus_hunt_session_id uuid NOT NULL REFERENCES bonus_hunt_sessions(id) ON DELETE CASCADE,
  betting_open boolean NOT NULL DEFAULT false,
  final_payout numeric,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'locked', 'resolved')),
  winner_user_id uuid REFERENCES users(id),
  winner_display_name text,
  winner_predicted_amount numeric,
  winner_diff numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  UNIQUE(bonus_hunt_session_id)
);

-- Player predictions
CREATE TABLE IF NOT EXISTS guess_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guess_session_id uuid NOT NULL REFERENCES guess_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  predicted_amount numeric NOT NULL CHECK (predicted_amount > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(guess_session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_guess_predictions_session ON guess_predictions(guess_session_id);
CREATE INDEX IF NOT EXISTS idx_guess_predictions_user ON guess_predictions(user_id);

-- ── Row Level Security ──────────────────────────────────────
-- Auth is enforced at the API level (server-side cookie).
-- RLS mirrors the pattern used by all other tables in this project.

ALTER TABLE guess_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE guess_predictions ENABLE ROW LEVEL SECURITY;

-- guess_sessions: public read, API handles auth for writes
CREATE POLICY "Public read guess_sessions"  ON guess_sessions FOR SELECT USING (true);
CREATE POLICY "API insert guess_sessions"   ON guess_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "API update guess_sessions"   ON guess_sessions FOR UPDATE USING (true);
CREATE POLICY "API delete guess_sessions"   ON guess_sessions FOR DELETE USING (true);

-- guess_predictions: public read (list shown after resolve), API handles auth for writes
CREATE POLICY "Public read guess_predictions" ON guess_predictions FOR SELECT USING (true);
CREATE POLICY "API insert guess_predictions"  ON guess_predictions FOR INSERT WITH CHECK (true);
CREATE POLICY "API update guess_predictions"  ON guess_predictions FOR UPDATE USING (true);
CREATE POLICY "API delete guess_predictions"  ON guess_predictions FOR DELETE USING (true);
