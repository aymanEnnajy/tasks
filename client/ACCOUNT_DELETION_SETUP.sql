-- Add deletion_scheduled_at column to users table
-- This tracks when a user scheduled their account for deletion
-- The actual deletion happens 10 days after this timestamp

ALTER TABLE users
ADD COLUMN deletion_scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add index for efficiency when checking scheduled deletions
CREATE INDEX idx_users_deletion_scheduled ON users(deletion_scheduled_at) 
WHERE deletion_scheduled_at IS NOT NULL;

-- Optional: Create a function to auto-delete accounts after 10 days
-- You can call this periodically (e.g., daily) via a cron job or scheduled function
CREATE OR REPLACE FUNCTION delete_expired_accounts()
RETURNS void AS $$
BEGIN
  -- Delete users whose 10-day deletion window has passed
  DELETE FROM users 
  WHERE deletion_scheduled_at IS NOT NULL 
  AND deletion_scheduled_at + INTERVAL '10 days' <= NOW();
END;
$$ LANGUAGE plpgsql;

-- Example: Grant permission to call the function
-- GRANT EXECUTE ON FUNCTION delete_expired_accounts() TO authenticated;
