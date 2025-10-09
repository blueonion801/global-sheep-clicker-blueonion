/*
  # Add Titles System

  1. Changes
    - Add `selected_title` column to user_currency table to store the selected title ID
    - Add `unlocked_titles` column to user_currency table to store array of unlocked title IDs
    - Add `show_title` column to user_currency table to toggle title visibility

  2. Title Unlock Milestones
    - idol: 100,000 total_clicks
    - vibing: 150,000 total_clicks
    - wool: 200,000 total_clicks
    - spooky: 250,000 total_clicks
    - calm: 300,000 total_clicks
    - unknown: 400,000 total_clicks
    - funny: 500,000 total_clicks
    - lucky: 600,000 total_clicks
    - free: 800,000 total_clicks
    - eternal: 1,000,000 total_clicks

  3. Security
    - Maintains existing RLS policies for user_currency table
    - Users can only modify their own title settings

  4. Special Users
    - SheepDev, SheepDev2, SheepDev3 can unlock all titles for testing
*/

-- Add title system columns to user_currency table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_currency' AND column_name = 'selected_title'
  ) THEN
    ALTER TABLE user_currency ADD COLUMN selected_title text DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_currency' AND column_name = 'unlocked_titles'
  ) THEN
    ALTER TABLE user_currency ADD COLUMN unlocked_titles text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_currency' AND column_name = 'show_title'
  ) THEN
    ALTER TABLE user_currency ADD COLUMN show_title boolean DEFAULT true;
  END IF;
END $$;
