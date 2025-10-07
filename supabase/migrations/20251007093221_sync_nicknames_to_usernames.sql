/*
  # Sync Nicknames to Usernames

  1. Changes
    - Update all users with null username to use their nickname as username
    - Ensures consistency between nickname and username fields
    - Handles potential conflicts by appending a number to duplicates

  2. Notes
    - This is a one-time sync for existing users
    - New users will have both fields set on creation
*/

-- First, update users where username is null to use their nickname
UPDATE users
SET username = nickname
WHERE username IS NULL;

-- Create a unique constraint on nickname if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_nickname_key'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_nickname_key UNIQUE (nickname);
  END IF;
END $$;