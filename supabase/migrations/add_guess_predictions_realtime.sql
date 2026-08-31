-- Enable Realtime for "Adivinha o Resultado" so open bets / resolution / winner
-- update live in the browser without a manual refresh (mirrors bonus_hunt_slots).
alter publication supabase_realtime add table guess_sessions;
alter publication supabase_realtime add table guess_predictions;
