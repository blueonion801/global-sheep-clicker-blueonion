/*
  # Add user statistics tracking

  1. New Tables
    - `user_stats`
      - `user_id` (uuid, primary key, foreign key to users)
      - `messages_sent` (integer, default 0)
      - `highest_daily_clicks` (integer, default 0)
      - `longest_coin_streak` (integer, default 0)
      - `total_days_active` (integer, default 0)
      - `first_click_date` (date)
      - `last_active_date` (date)
      - `daily_click_history` (jsonb, stores daily click counts)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_stats` table
    - Add policies for users to read and update their own stats

  3. Functions
    - Function to calculate daily averages and update stats
*/

CREATE TABLE IF NOT EXISTS user_stats (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  messages_sent integer DEFAULT 0,
  highest_daily_clicks integer DEFAULT 0,
  longest_coin_streak integer DEFAULT 0,
  total_days_active integer DEFAULT 0,
  first_click_date date,
  last_active_date date,
  daily_click_history jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own stats"
  ON user_stats
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can insert own stats"
  ON user_stats
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can update own stats"
  ON user_stats
  FOR UPDATE
  TO public
  USING (true);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);

-- Function to update daily stats
CREATE OR REPLACE FUNCTION update_user_daily_stats(
  p_user_id uuid,
  p_clicks_today integer DEFAULT 0,
  p_message_sent boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  today_date date := CURRENT_DATE;
  current_stats record;
  daily_history jsonb;
  today_key text := to_char(today_date, 'YYYY-MM-DD');
BEGIN
  -- Get or create user stats
  SELECT * INTO current_stats
  FROM user_stats
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO user_stats (
      user_id,
      first_click_date,
      last_active_date,
      daily_click_history
    ) VALUES (
      p_user_id,
      today_date,
      today_date,
      jsonb_build_object(today_key, p_clicks_today)
    );
    RETURN;
  END IF;
  
  -- Update daily click history
  daily_history := COALESCE(current_stats.daily_click_history, '{}'::jsonb);
  daily_history := daily_history || jsonb_build_object(today_key, p_clicks_today);
  
  -- Update stats
  UPDATE user_stats SET
    messages_sent = CASE 
      WHEN p_message_sent THEN messages_sent + 1 
      ELSE messages_sent 
    END,
    highest_daily_clicks = GREATEST(highest_daily_clicks, p_clicks_today),
    last_active_date = today_date,
    daily_click_history = daily_history,
    total_days_active = (
      SELECT COUNT(DISTINCT key)
      FROM jsonb_each_text(daily_history)
      WHERE value::integer > 0
    ),
    updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;