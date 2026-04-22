-- Add avatar column to spin_history to store Twitch profile_image_url
ALTER TABLE spin_history
ADD COLUMN IF NOT EXISTS avatar text;
