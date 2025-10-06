/*
  # Add Top 3 Leaderboard Streak Tracking

  1. Changes
    - Add `longest_top3_streak` column to `user_stats` table
      - Tracks the longest consecutive days a player has been in the top 3
    - Add `current_top3_streak` column to `user_stats` table
      - Tracks the current consecutive days a player is in the top 3
    - Add `last_top3_check_date` column to `user_stats` table
      - Tracks the last date we checked if the player was in top 3

  2. Notes
    - Default values are 0 for streak counters
    - This will need to be updated by a scheduled job or function that checks daily rankings
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_stats' AND column_name = 'longest_top3_streak'
  ) THEN
    ALTER TABLE user_stats ADD COLUMN longest_top3_streak integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_stats' AND column_name = 'current_top3_streak'
  ) THEN
    ALTER TABLE user_stats ADD COLUMN current_top3_streak integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_stats' AND column_name = 'last_top3_check_date'
  ) THEN
    ALTER TABLE user_stats ADD COLUMN last_top3_check_date date;
  END IF;
END $$;