/*
  # Remove remaining sparkle particle

  1. Changes
    - Remove any remaining sparkle particle collectibles
    - Clean up user collections
    - Update box rewards that reference sparkle particles
*/

-- Remove user collectibles for sparkle particles
DELETE FROM user_collectibles 
WHERE collectible_id IN (
  SELECT id FROM collectibles 
  WHERE emoji = '✨' AND type = 'particle'
);

-- Update any box rewards that gave sparkle particles to give gems instead
UPDATE embroidered_boxes 
SET reward_type = 'gems', 
    reward_amount = 5, 
    reward_collectible_id = NULL
WHERE reward_collectible_id IN (
  SELECT id FROM collectibles 
  WHERE emoji = '✨' AND type = 'particle'
);

-- Remove sparkle particle collectibles
DELETE FROM collectibles 
WHERE emoji = '✨' AND type = 'particle';

-- Also remove any other sparkle-related particles that might exist
DELETE FROM user_collectibles 
WHERE collectible_id IN (
  SELECT id FROM collectibles 
  WHERE (name ILIKE '%sparkle%' OR emoji = '✨') AND type = 'particle'
);

DELETE FROM collectibles 
WHERE (name ILIKE '%sparkle%' OR emoji = '✨') AND type = 'particle';