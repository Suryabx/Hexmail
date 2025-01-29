/*
  # Fix permissions for auth.users access

  1. Changes
    - Grant SELECT permission on auth.users to authenticated users
    - This allows authenticated users to access email addresses for message filtering
*/

-- Grant SELECT permission on auth.users to authenticated users
GRANT SELECT ON auth.users TO authenticated;

-- Ensure messages table permissions are correct
GRANT ALL ON messages TO authenticated;

-- Update message policies to use auth.users properly
DROP POLICY IF EXISTS "Users can read messages sent to them" ON messages;
CREATE POLICY "Users can read messages sent to them"
  ON messages
  FOR SELECT
  USING (
    recipient_email = (
      SELECT email 
      FROM auth.users 
      WHERE id = auth.uid()
    )
    OR sender_id = auth.uid()
  );

-- Ensure user_profiles permissions are correct
GRANT ALL ON user_profiles TO authenticated;