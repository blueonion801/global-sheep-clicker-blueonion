/*
  # Remove sparkle and atom click particles

  1. Changes
    - Remove sparkle and atom particle collectibles from the collectibles table
    - Clean up any user_collectibles references to these items
    - Remove any embroidered_boxes rewards that reference these items

  2. Security
    - No RLS changes needed as we're only removing data
*/

-- Remove user collectibles for sparkle and atom particles
DELETE FROM user_collectibles 
WHERE collectible_id IN ('particle_sparkle', 'particle_atom');

-- Remove embroidered box rewards that reference these collectibles
UPDATE embroidered_boxes 
SET reward_collectible_id = NULL 
WHERE reward_collectible_id IN ('particle_sparkle', 'particle_atom');

-- Remove the collectibles themselves
DELETE FROM collectibles 
WHERE id IN ('particle_sparkle', 'particle_atom');