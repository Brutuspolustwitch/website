-- Move wheel cooldown to database to prevent client-side exploits
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_spin_at timestamptz;

COMMENT ON COLUMN users.last_spin_at IS 'Timestamp of last wheel spin — used for server-side 24h cooldown enforcement';
