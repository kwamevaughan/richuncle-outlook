-- Add crop_transform column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS crop_transform JSONB;

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_crop_transform ON users USING GIN (crop_transform);

-- Add comment to document the column
COMMENT ON COLUMN users.crop_transform IS 'Stores image transformation parameters (crop, position, scale, rotation) for profile pictures'; 