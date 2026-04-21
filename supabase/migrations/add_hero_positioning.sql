-- Add hero text positioning and layout controls to page_settings
ALTER TABLE page_settings 
  ADD COLUMN IF NOT EXISTS hero_text_align text DEFAULT 'left' CHECK (hero_text_align IN ('left', 'center', 'right')),
  ADD COLUMN IF NOT EXISTS hero_position_x integer DEFAULT 6 CHECK (hero_position_x >= 0 AND hero_position_x <= 100),
  ADD COLUMN IF NOT EXISTS hero_position_y integer DEFAULT 32 CHECK (hero_position_y >= 0 AND hero_position_y <= 100),
  ADD COLUMN IF NOT EXISTS hero_max_width integer DEFAULT 768 CHECK (hero_max_width >= 300 AND hero_max_width <= 1920);

-- Update home page with default positioning values
UPDATE page_settings 
SET 
  hero_text_align = 'left',
  hero_position_x = 6,
  hero_position_y = 32,
  hero_max_width = 768
WHERE page_slug = 'home';
