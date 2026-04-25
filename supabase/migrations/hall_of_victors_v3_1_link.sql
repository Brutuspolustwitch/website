-- ============================================================
-- HALL OF VICTORS v3.1 — link required, image moderator-added
-- Run after hall_of_victors_v3.sql.
-- ============================================================

-- Add `url` column (the proof link the user submits)
alter table hov_victories add column if not exists url text;

-- Image becomes optional (moderator adds it during approval)
alter table hov_victories alter column image_url drop not null;

-- Backfill: if any older rows exist without a url, leave as null (they were image-first)
