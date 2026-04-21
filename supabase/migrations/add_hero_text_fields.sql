-- Add hero_title and hero_description columns to page_settings table
-- Run this migration in Supabase SQL Editor to update your existing database

ALTER TABLE page_settings 
  ADD COLUMN IF NOT EXISTS hero_title text,
  ADD COLUMN IF NOT EXISTS hero_description text;

-- Set default values for the home page (optional)
UPDATE page_settings 
SET 
  hero_title = 'ENTER THE ARENA',
  hero_description = 'A brutal cinematic iGaming coliseum for live slot battles, bonus hunts, ranked challengers, and high-conversion casino discovery.'
WHERE page_slug = 'home' 
  AND hero_title IS NULL 
  AND hero_description IS NULL;
