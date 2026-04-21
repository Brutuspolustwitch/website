-- Add font size controls to page_settings table
-- Run this migration in Supabase SQL Editor

ALTER TABLE page_settings 
  ADD COLUMN IF NOT EXISTS hero_title_size numeric DEFAULT 1.0 CHECK (hero_title_size >= 0.5 AND hero_title_size <= 2.0),
  ADD COLUMN IF NOT EXISTS hero_description_size numeric DEFAULT 1.0 CHECK (hero_description_size >= 0.5 AND hero_description_size <= 2.0);

-- Set default values for the home page
UPDATE page_settings 
SET 
  hero_title_size = 1.0,
  hero_description_size = 1.0
WHERE page_slug = 'home' 
  AND hero_title_size IS NULL 
  AND hero_description_size IS NULL;
