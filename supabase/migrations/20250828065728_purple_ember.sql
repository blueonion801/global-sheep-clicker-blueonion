/*
  # Global Sheep Clicker Database Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `nickname` (text, unique)
      - `total_clicks` (integer, default 0)
      - `tier` (integer, default 0)
      - `created_at` (timestamp)
    - `global_stats`
      - `id` (text, primary key, fixed as 'global')
      - `total_sheep` (bigint, default 0)
      - `updated_at` (timestamp)
    - `chat_messages`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `nickname` (text)
      - `message` (text)
      - `tier` (integer, default 0)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Allow public read access to all tables
    - Allow public insert/update for users and chat_messages
    - Allow public update for global_stats

  3. Indexes
    - Index on chat_messages.created_at for efficient ordering
    - Index on users.total_clicks for leaderboards
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname text UNIQUE NOT NULL,
  total_clicks integer DEFAULT 0,
  tier integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create global_stats table
CREATE TABLE IF NOT EXISTS global_stats (
  id text PRIMARY KEY DEFAULT 'global',
  total_sheep bigint DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  nickname text NOT NULL,
  message text NOT NULL,
  tier integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Anyone can read users"
  ON users
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert users"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update users"
  ON users
  FOR UPDATE
  TO public
  USING (true);

-- Create policies for global_stats table
CREATE POLICY "Anyone can read global stats"
  ON global_stats
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can update global stats"
  ON global_stats
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Anyone can insert global stats"
  ON global_stats
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create policies for chat_messages table
CREATE POLICY "Anyone can read chat messages"
  ON chat_messages
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert chat messages"
  ON chat_messages
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_total_clicks ON users(total_clicks DESC);
CREATE INDEX IF NOT EXISTS idx_users_nickname ON users(nickname);

-- Initialize global stats if not exists
INSERT INTO global_stats (id, total_sheep, updated_at)
VALUES ('global', 0, now())
ON CONFLICT (id) DO NOTHING;