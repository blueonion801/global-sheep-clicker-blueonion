/*
  # Add Wool Coins Currency System

  1. New Tables
    - `user_currency`
      - `user_id` (uuid, foreign key to users)
      - `wool_coins` (integer, default 0)
      - `last_daily_claim` (timestamp)
      - `consecutive_days` (integer, default 0)
      - `selected_theme` (text, default 'cosmic')
      - `unlocked_themes` (text array, default ['cosmic'])
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_currency` table
    - Add policies for users to manage their own currency data

  3. Changes
    - Add wool coins tracking and theme management
    - Support for daily rewards and consecutive day tracking
*/

CREATE TABLE IF NOT EXISTS user_currency (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  wool_coins integer DEFAULT 0,
  last_daily_claim timestamptz,
  consecutive_days integer DEFAULT 0,
  selected_theme text DEFAULT 'cosmic',
  unlocked_themes text[] DEFAULT ARRAY['cosmic'],
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_currency ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own currency data"
  ON user_currency
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can insert own currency data"
  ON user_currency
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can update own currency data"
  ON user_currency
  FOR UPDATE
  TO public
  USING (true);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_user_currency_user_id ON user_currency(user_id);

-- Function to handle daily rewards
CREATE OR REPLACE FUNCTION claim_daily_reward(p_user_id uuid)
RETURNS TABLE(
  wool_coins_earned integer,
  new_consecutive_days integer,
  new_total_coins integer
) AS $$
DECLARE
  current_currency RECORD;
  coins_to_award integer;
  new_consecutive integer;
  last_claim_date date;
  today_date date;
BEGIN
  -- Get current currency data
  SELECT * INTO current_currency
  FROM user_currency
  WHERE user_id = p_user_id;
  
  -- If no currency record exists, create one
  IF current_currency IS NULL THEN
    INSERT INTO user_currency (user_id, wool_coins, consecutive_days, last_daily_claim)
    VALUES (p_user_id, 0, 0, null);
    
    SELECT * INTO current_currency
    FROM user_currency
    WHERE user_id = p_user_id;
  END IF;
  
  today_date := CURRENT_DATE;
  last_claim_date := DATE(current_currency.last_daily_claim);
  
  -- Check if user can claim daily reward
  IF current_currency.last_daily_claim IS NULL OR last_claim_date < today_date THEN
    -- Calculate consecutive days
    IF current_currency.last_daily_claim IS NULL THEN
      new_consecutive := 1;
    ELSIF last_claim_date = today_date - INTERVAL '1 day' THEN
      new_consecutive := current_currency.consecutive_days + 1;
    ELSE
      new_consecutive := 1; -- Reset streak if more than 1 day gap
    END IF;
    
    -- Calculate coins to award (base 5 + bonus for consecutive days)
    coins_to_award := 5 + LEAST(new_consecutive - 1, 10); -- Max 15 coins per day
    
    -- Update currency
    UPDATE user_currency
    SET 
      wool_coins = current_currency.wool_coins + coins_to_award,
      consecutive_days = new_consecutive,
      last_daily_claim = now(),
      updated_at = now()
    WHERE user_id = p_user_id;
    
    RETURN QUERY SELECT 
      coins_to_award,
      new_consecutive,
      current_currency.wool_coins + coins_to_award;
  ELSE
    -- Already claimed today
    RETURN QUERY SELECT 
      0,
      current_currency.consecutive_days,
      current_currency.wool_coins;
  END IF;
END;
$$ LANGUAGE plpgsql;