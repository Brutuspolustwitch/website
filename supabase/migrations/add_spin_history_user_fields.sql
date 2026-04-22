-- Add Twitch user fields to spin_history for displaying avatars in history panel
ALTER TABLE spin_history
ADD COLUMN IF NOT EXISTS twitch_login text,
ADD COLUMN IF NOT EXISTS avatar_url text;

COMMENT ON COLUMN spin_history.twitch_login IS 'Twitch login/username of the user who spun';
COMMENT ON COLUMN spin_history.avatar_url IS 'Twitch profile image URL of the user who spun';
