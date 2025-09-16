/*
  # Add increment function for global sheep count

  1. New Functions
    - `increment_global_sheep(increment_by)` - Safely increments the global sheep count
      - Uses atomic operations to prevent race conditions
      - Creates the global stats record if it doesn't exist
      - Returns the updated total

  2. Security
    - Function is accessible to public role for game functionality
*/

-- Create or replace the increment function
CREATE OR REPLACE FUNCTION increment_global_sheep(increment_by INTEGER DEFAULT 1)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_total BIGINT;
BEGIN
  -- Insert or update the global stats atomically
  INSERT INTO global_stats (id, total_sheep, updated_at)
  VALUES ('global', increment_by, now())
  ON CONFLICT (id)
  DO UPDATE SET 
    total_sheep = global_stats.total_sheep + increment_by,
    updated_at = now()
  RETURNING total_sheep INTO new_total;
  
  RETURN new_total;
END;
$$;

-- Grant execute permission to public role
GRANT EXECUTE ON FUNCTION increment_global_sheep(INTEGER) TO public;