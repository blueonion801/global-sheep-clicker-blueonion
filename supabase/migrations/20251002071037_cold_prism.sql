/*
  # Add separate daily box claim tracking

  1. New Column
    - `last_daily_box_claim` (timestamp) - tracks when user last claimed daily box
  
  2. Changes
    - Separates daily box claims from daily coin claims
    - Allows independent claiming of daily rewards and daily boxes
*/

ALTER TABLE user_currency 
ADD COLUMN IF NOT EXISTS last_daily_box_claim timestamptz DEFAULT NULL;