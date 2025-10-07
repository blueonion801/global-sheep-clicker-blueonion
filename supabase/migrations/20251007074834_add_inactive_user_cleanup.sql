/*
  # Add Inactive User Cleanup System

  1. New Functions
    - `cleanup_inactive_users()` - Removes users who:
      - Have nickname matching "Sheep" followed by numbers only
      - Have 0 total clicks
      - Haven't been active for 7+ days (based on created_at)
    
  2. Changes
    - Creates a scheduled cleanup function
    - Cascading deletes will clean up related records in:
      - user_currency
      - user_stats
      - chat_messages
      - user_collectibles
      - embroidered_boxes

  3. Security
    - Function uses SECURITY DEFINER to run with elevated privileges
    - Only affects truly inactive users (0 clicks, default nickname, 7+ days old)
    
  4. Notes
    - This keeps the database clean and performant
    - Active users or users who have clicked even once are never deleted
    - Users with custom nicknames are never deleted
*/

-- Create function to cleanup inactive users
CREATE OR REPLACE FUNCTION cleanup_inactive_users()
RETURNS TABLE(deleted_count INTEGER) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  users_deleted INTEGER;
BEGIN
  -- Delete users matching criteria:
  -- 1. Nickname matches pattern "Sheep" followed by only digits
  -- 2. Total clicks is 0
  -- 3. Created at least 7 days ago
  DELETE FROM users
  WHERE 
    nickname ~ '^Sheep[0-9]+$'
    AND total_clicks = 0
    AND created_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS users_deleted = ROW_COUNT;
  
  RETURN QUERY SELECT users_deleted;
END;
$$;

-- Grant execute permission to authenticated users (for testing)
GRANT EXECUTE ON FUNCTION cleanup_inactive_users() TO authenticated, anon;

-- Create a scheduled job that runs daily at 3 AM UTC
-- Note: This requires the pg_cron extension which may not be available in all Supabase instances
-- If pg_cron is not available, you can call this function from an Edge Function with a cron trigger

DO $$
BEGIN
  -- Check if pg_cron extension exists
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Remove existing job if it exists
    PERFORM cron.unschedule('cleanup-inactive-users');
    
    -- Schedule the cleanup job to run daily at 3 AM UTC
    PERFORM cron.schedule(
      'cleanup-inactive-users',
      '0 3 * * *',
      'SELECT cleanup_inactive_users();'
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- pg_cron not available, that's ok - function can be called manually or via Edge Function
    RAISE NOTICE 'pg_cron not available - cleanup function created but not scheduled';
END;
$$;