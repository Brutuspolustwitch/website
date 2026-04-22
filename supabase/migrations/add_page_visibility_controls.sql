-- Add page visibility and role-based access controls
-- Step 1: Add is_active column to control if page is visible to everyone
ALTER TABLE page_settings 
ADD COLUMN is_active boolean NOT NULL DEFAULT true;

-- Step 2: Add min_role column to control minimum role required to see the page
ALTER TABLE page_settings 
ADD COLUMN min_role text NOT NULL DEFAULT 'viewer' 
CHECK (min_role IN ('viewer', 'moderador', 'configurador', 'admin'));

-- Step 3: Add comment for documentation
COMMENT ON COLUMN page_settings.is_active IS 'Controls whether the page is active and visible to users';
COMMENT ON COLUMN page_settings.min_role IS 'Minimum role required to view this page (viewer, moderador, configurador, admin)';
