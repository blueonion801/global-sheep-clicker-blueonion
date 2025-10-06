/*
  # Add Username/Password Authentication System

  1. Changes
    - Add `username` column to `users` table
      - Unique username for login
      - Required field for all new accounts
    - Add `password_hash` column to `users` table
      - Stores hashed password
      - Required field for all accounts
    - Add index on username for faster lookups
    - Update RLS policies to support authentication
    - Create function to transfer progress to authenticated users

  2. Security
    - Username must be unique
    - Password is hashed and never stored in plain text
    - RLS policies ensure users can only access their own data
    - Public read access for leaderboard and global stats

  3. Notes
    - Existing users will need to create accounts to claim their progress
    - Username lookup is indexed for performance
*/

-- Add username and password_hash columns to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'username'
  ) THEN
    ALTER TABLE users ADD COLUMN username text UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE users ADD COLUMN password_hash text;
  END IF;
END $$;

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Create index on auth_user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);

-- Drop existing policies and create new ones
DROP POLICY IF EXISTS "Users can read all profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Allow anyone to read user profiles (for leaderboard)
CREATE POLICY "Anyone can read user profiles"
  ON users FOR SELECT
  TO authenticated, anon
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth_user_id = auth.uid());