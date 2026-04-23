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
