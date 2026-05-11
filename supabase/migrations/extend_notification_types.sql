-- Extend notifications.type check constraint to include SE points and jackpot events
-- Run this in Supabase SQL editor

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'giveaway_win',
    'guess_result_win',
    'jackpot_win',
    'general',
    'se_points_earned',
    'se_points_spent'
  ));
