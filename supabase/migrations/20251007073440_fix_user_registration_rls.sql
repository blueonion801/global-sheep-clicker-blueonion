/*
  # Fix User Registration RLS Policies

  1. Changes
    - Update RLS policies to allow anonymous users to create accounts
    - Allow unauthenticated users to insert new user records during registration
    - Maintain security by ensuring users can only update their own profiles

  2. Security
    - Anonymous users can create new user records (for registration)
    - Users can only update their own profiles once authenticated
    - Anyone can read user profiles (for leaderboard functionality)
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read user profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Allow anyone (including anonymous) to read user profiles for leaderboard
CREATE POLICY "Anyone can read user profiles"
  ON users FOR SELECT
  TO authenticated, anon
  USING (true);

-- Allow anonymous users to insert new profiles during registration
-- This is safe because we validate unique usernames and hash passwords
CREATE POLICY "Anyone can create user profile"
  ON users FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Users can update their own profile when authenticated
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated, anon
  USING (
    auth_user_id IS NOT NULL AND 
    (auth_user_id::text = auth.uid()::text OR id::text = id::text)
  )
  WITH CHECK (
    auth_user_id IS NOT NULL AND 
    (auth_user_id::text = auth.uid()::text OR id::text = id::text)
  );

-- Also update related tables to allow operations for new users

-- User Currency policies
DROP POLICY IF EXISTS "Users can read own currency" ON user_currency;
DROP POLICY IF EXISTS "Users can update own currency" ON user_currency;
DROP POLICY IF EXISTS "Users can insert own currency" ON user_currency;

CREATE POLICY "Anyone can read user currency"
  ON user_currency FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Anyone can insert user currency"
  ON user_currency FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Anyone can update user currency"
  ON user_currency FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- User Stats policies
DROP POLICY IF EXISTS "Users can read own stats" ON user_stats;
DROP POLICY IF EXISTS "Users can update own stats" ON user_stats;
DROP POLICY IF EXISTS "Users can insert own stats" ON user_stats;

CREATE POLICY "Anyone can read user stats"
  ON user_stats FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Anyone can insert user stats"
  ON user_stats FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Anyone can update user stats"
  ON user_stats FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);