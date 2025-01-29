/*
  # Fix permissions for messages table
  
  1. Changes
    - Grant proper permissions for authenticated users to access messages table
    - Add policy for users to read their own messages
    - Add policy for users to read messages they sent
  
  2. Security
    - Ensures users can only access messages where they are either the sender or recipient
*/

-- Grant permissions to authenticated users
GRANT SELECT ON messages TO authenticated;

-- Update the policy for reading received messages to be more specific
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
  );

-- Update the policy for reading sent messages
DROP POLICY IF EXISTS "Users can read messages they sent" ON messages;
CREATE POLICY "Users can read messages they sent"
  ON messages
  FOR SELECT
  USING (sender_id = auth.uid());

-- Update the policy for creating messages
DROP POLICY IF EXISTS "Users can create messages" ON messages;
CREATE POLICY "Users can create messages"
  ON messages
  FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- Update the policy for updating messages
DROP POLICY IF EXISTS "Users can update their received messages" ON messages;
CREATE POLICY "Users can update their received messages"
  ON messages
  FOR UPDATE
  USING (
    recipient_email = (
      SELECT email 
      FROM auth.users 
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    recipient_email = (
      SELECT email 
      FROM auth.users 
      WHERE id = auth.uid()
    )
  );