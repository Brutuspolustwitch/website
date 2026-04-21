-- Change ELITE badge to TOP and update database constraint
-- Step 1: Update existing ELITE badges to TOP
UPDATE casino_offers 
SET badge = 'TOP' 
WHERE badge = 'ELITE';

-- Step 2: Drop the old constraint
ALTER TABLE casino_offers 
DROP CONSTRAINT IF EXISTS casino_offers_badge_check;

-- Step 3: Add new constraint with TOP instead of ELITE
ALTER TABLE casino_offers 
ADD CONSTRAINT casino_offers_badge_check 
CHECK (badge IN ('NEW', 'HOT', 'TOP', NULL));
