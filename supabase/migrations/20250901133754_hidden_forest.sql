/*
  # Create increment_global_sheep function

  1. New Functions
    - `increment_global_sheep(increment_by integer)`
      - Atomically increments the global sheep count
      - Updates the updated_at timestamp
      - Creates the global stats row if it doesn't exist

  2. Security
    - Function is accessible to public users
    - Uses atomic operations to prevent race conditions
*/

CREATE OR REPLACE FUNCTION increment_global_sheep(increment_by integer)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert or update the global stats row atomically
  INSERT INTO global_stats (id, total_sheep, updated_at)
  VALUES ('global', increment_by, now())
  ON CONFLICT (id)
  DO UPDATE SET
    total_sheep = global_stats.total_sheep + increment_by,
    updated_at = now();
END;
$$;