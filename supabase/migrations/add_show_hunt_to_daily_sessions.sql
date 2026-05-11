-- Add show_hunt column to daily_sessions
-- Controls whether the Bonus Hunt tracker is shown on the daily-session public page

ALTER TABLE daily_sessions
ADD COLUMN IF NOT EXISTS show_hunt boolean NOT NULL DEFAULT true;
