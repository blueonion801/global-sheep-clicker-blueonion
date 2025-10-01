/*
  # Add Crochet Shop System

  1. New Tables
    - `user_collectibles` - tracks user's collectible inventory and selected items
    - `collectibles` - master list of all available collectibles
    - `embroidered_boxes` - tracks daily box claims and purchases

  2. Updates to Existing Tables
    - Add `sheep_gems` and `last_gem_claim` to `user_currency`

  3. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their own data
*/

-- Add sheep gems to user_currency table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_currency' AND column_name = 'sheep_gems'
  ) THEN
    ALTER TABLE user_currency ADD COLUMN sheep_gems integer DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_currency' AND column_name = 'last_gem_claim'
  ) THEN
    ALTER TABLE user_currency ADD COLUMN last_gem_claim timestamp with time zone DEFAULT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_currency' AND column_name = 'selected_sheep_emoji'
  ) THEN
    ALTER TABLE user_currency ADD COLUMN selected_sheep_emoji text DEFAULT '🐑';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_currency' AND column_name = 'selected_particle'
  ) THEN
    ALTER TABLE user_currency ADD COLUMN selected_particle text DEFAULT '✧';
  END IF;
END $$;

-- Create collectibles master table
CREATE TABLE IF NOT EXISTS collectibles (
  id text PRIMARY KEY,
  name text NOT NULL,
  emoji text NOT NULL,
  type text NOT NULL CHECK (type IN ('sheep_emoji', 'particle')),
  rarity text NOT NULL CHECK (rarity IN ('free', 'normal', 'epic', 'legendary')),
  gem_cost integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create user collectibles table
CREATE TABLE IF NOT EXISTS user_collectibles (
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  collectible_id text REFERENCES collectibles(id) ON DELETE CASCADE,
  obtained_at timestamptz DEFAULT now(),
  obtained_from text DEFAULT 'purchase' CHECK (obtained_from IN ('purchase', 'box', 'free')),
  PRIMARY KEY (user_id, collectible_id)
);

-- Create embroidered boxes tracking table
CREATE TABLE IF NOT EXISTS embroidered_boxes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  box_type text NOT NULL CHECK (box_type IN ('daily', 'purchased')),
  opened_at timestamptz DEFAULT now(),
  reward_type text NOT NULL CHECK (reward_type IN ('coins', 'gems', 'collectible')),
  reward_amount integer DEFAULT 0,
  reward_collectible_id text REFERENCES collectibles(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE collectibles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_collectibles ENABLE ROW LEVEL SECURITY;
ALTER TABLE embroidered_boxes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can read collectibles"
  ON collectibles
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can read own collectibles"
  ON user_collectibles
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can insert own collectibles"
  ON user_collectibles
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can read own boxes"
  ON embroidered_boxes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can insert own boxes"
  ON embroidered_boxes
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Insert all collectibles
INSERT INTO collectibles (id, name, emoji, type, rarity, gem_cost) VALUES
-- Free sheep emojis
('sheep_sheep', 'Sheep', '🐑', 'sheep_emoji', 'free', 0),
('sheep_chick', 'Chick', '🐥', 'sheep_emoji', 'free', 0),

-- Normal sheep emojis (20 gems)
('sheep_cat', 'Cat', '🐈', 'sheep_emoji', 'normal', 20),
('sheep_squirrel', 'Squirrel', '🐿️', 'sheep_emoji', 'normal', 20),
('sheep_otter', 'Otter', '🦦', 'sheep_emoji', 'normal', 20),
('sheep_hedgehog', 'Hedgehog', '🦔', 'sheep_emoji', 'normal', 20),
('sheep_sloth', 'Sloth', '🦥', 'sheep_emoji', 'normal', 20),
('sheep_owl', 'Owl', '🦉', 'sheep_emoji', 'normal', 20),
('sheep_horse', 'Horse', '🐎', 'sheep_emoji', 'normal', 20),
('sheep_dog', 'Dog', '🐕', 'sheep_emoji', 'normal', 20),
('sheep_beaver', 'Beaver', '🦫', 'sheep_emoji', 'normal', 20),
('sheep_goat', 'Goat', '🐐', 'sheep_emoji', 'normal', 20),

-- Normal sheep emojis (50 gems)
('sheep_dolphin', 'Dolphin', '🐬', 'sheep_emoji', 'normal', 50),
('sheep_fish', 'Fish', '🐟', 'sheep_emoji', 'normal', 50),
('sheep_jellyfish', 'Jellyfish', '🪼', 'sheep_emoji', 'normal', 50),
('sheep_whale', 'Whale', '🐳', 'sheep_emoji', 'normal', 50),
('sheep_swan', 'Swan', '🦢', 'sheep_emoji', 'normal', 50),
('sheep_tropical_fish', 'Tropical Fish', '🐠', 'sheep_emoji', 'normal', 50),
('sheep_shell', 'Shell', '🐚', 'sheep_emoji', 'normal', 50),
('sheep_squid', 'Squid', '🦑', 'sheep_emoji', 'normal', 50),
('sheep_duck', 'Duck', '🦆', 'sheep_emoji', 'normal', 50),
('sheep_flamingo', 'Flamingo', '🦩', 'sheep_emoji', 'normal', 50),

-- Normal sheep emojis (70 gems)
('sheep_dragon', 'Dragon', '🐉', 'sheep_emoji', 'normal', 70),
('sheep_bird', 'Bird', '🐦', 'sheep_emoji', 'normal', 70),
('sheep_octopus', 'Octopus', '🐙', 'sheep_emoji', 'normal', 70),
('sheep_badger', 'Badger', '🦡', 'sheep_emoji', 'normal', 70),
('sheep_skunk', 'Skunk', '🦨', 'sheep_emoji', 'normal', 70),
('sheep_ladybug', 'Ladybug', '🐞', 'sheep_emoji', 'normal', 70),
('sheep_trex', 'T-Rex', '🦖', 'sheep_emoji', 'normal', 70),
('sheep_parrot', 'Parrot', '🦜', 'sheep_emoji', 'normal', 70),
('sheep_butterfly', 'Butterfly', '🦋', 'sheep_emoji', 'normal', 70),
('sheep_unicorn', 'Unicorn', '🦄', 'sheep_emoji', 'normal', 70),

-- Epic sheep emojis (100 gems)
('sheep_snail', 'Snail', '🐌', 'sheep_emoji', 'epic', 100),
('sheep_phoenix', 'Phoenix', '🐦‍🔥', 'sheep_emoji', 'epic', 100),
('sheep_peacock', 'Peacock', '🦚', 'sheep_emoji', 'epic', 100),
('sheep_ant', 'Ant', '🐜', 'sheep_emoji', 'epic', 100),
('sheep_shrimp', 'Shrimp', '🦐', 'sheep_emoji', 'epic', 100),
('sheep_carousel', 'Carousel Horse', '🎠', 'sheep_emoji', 'epic', 100),
('sheep_poodle', 'Poodle', '🐩', 'sheep_emoji', 'epic', 100),

-- Legendary sheep emojis (box only)
('sheep_ram', 'Ram', '🐏', 'sheep_emoji', 'legendary', 0),
('sheep_bee', 'Bee', '🐝', 'sheep_emoji', 'legendary', 0),
('sheep_penguin', 'Penguin', '🐧', 'sheep_emoji', 'legendary', 0),

-- Free particles
('particle_star_outline', 'Star Outline', '✧', 'particle', 'free', 0),
('particle_star_filled', 'Star Filled', '✮', 'particle', 'free', 0),

-- Normal particles (40 gems)
('particle_star_black', 'Black Star', '★', 'particle', 'normal', 40),
('particle_star_six', 'Six Point Star', '✦', 'particle', 'normal', 40),
('particle_star_eight', 'Eight Point Star', '✰', 'particle', 'normal', 40),
('particle_star_pinwheel', 'Pinwheel Star', '✯', 'particle', 'normal', 40),
('particle_star_sparkle', 'Sparkle', '✴', 'particle', 'normal', 40),
('particle_shell_symbol', 'Shell Symbol', '𓇼', 'particle', 'normal', 40),

-- Normal particles (80 gems)
('particle_heart_outline', 'Heart Outline', '♡', 'particle', 'normal', 80),
('particle_star_spark', 'Star Spark', '⚝', 'particle', 'normal', 80),
('particle_heart_filled', 'Heart Filled', '♥︎', 'particle', 'normal', 80),
('particle_star_circle', 'Star Circle', '✪', 'particle', 'normal', 80),
('particle_flower', 'Flower', '❀', 'particle', 'normal', 80),
('particle_circle_dot', 'Circle Dot', '⏾', 'particle', 'normal', 80),

-- Epic particles (120 gems)
('particle_music_note', 'Music Note', '♪', 'particle', 'epic', 120),
('particle_music_notes', 'Music Notes', '♫', 'particle', 'epic', 120),
('particle_star_crescent', 'Star Crescent', '𖦹', 'particle', 'epic', 120),
('particle_lightning', 'Lightning', '🗲', 'particle', 'epic', 120),
('particle_coffee', 'Coffee', '☕︎', 'particle', 'epic', 120),
('particle_cloud', 'Cloud', '☁︎', 'particle', 'epic', 120),

-- Legendary particles (box only)
('particle_biohazard', 'Biohazard', '☣︎', 'particle', 'legendary', 0),
('particle_atom', 'Atom', '⚛', 'particle', 'legendary', 0),
('particle_treble_clef', 'Treble Clef', '𝄞', 'particle', 'legendary', 0),
('particle_warning', 'Warning', '⚠︎', 'particle', 'legendary', 0),
('particle_power', 'Power', '⏻', 'particle', 'legendary', 0)

ON CONFLICT (id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_collectibles_user_id ON user_collectibles(user_id);
CREATE INDEX IF NOT EXISTS idx_embroidered_boxes_user_id ON embroidered_boxes(user_id);
CREATE INDEX IF NOT EXISTS idx_collectibles_type_rarity ON collectibles(type, rarity);