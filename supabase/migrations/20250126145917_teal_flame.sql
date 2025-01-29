/*
  # Create messages system

  1. New Tables
    - `messages`
      - `id` (uuid, primary key)
      - `sender_id` (uuid, references auth.users)
      - `recipient_email` (text)
      - `subject` (text)
      - `content` (text)
      - `read` (boolean)
      - `starred` (boolean)
      - `created_at` (timestamp)
      - `folder` (text) - 'inbox', 'sent', 'trash', 'archive'

  2. Security
    - Enable RLS on `messages` table
    - Add policies for:
      - Users can read messages sent to their email
      - Users can read messages they sent
      - Users can create new messages
      - Users can update their own messages (mark as read/starred)
*/

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES auth.users NOT NULL,
  recipient_email text NOT NULL,
  subject text NOT NULL,
  content text NOT NULL,
  read boolean DEFAULT false,
  starred boolean DEFAULT false,
  folder text DEFAULT 'inbox',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy for reading received messages
CREATE POLICY "Users can read messages sent to them"
  ON messages
  FOR SELECT
  USING (
    recipient_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

-- Policy for reading sent messages
CREATE POLICY "Users can read messages they sent"
  ON messages
  FOR SELECT
  USING (sender_id = auth.uid());

-- Policy for creating messages
CREATE POLICY "Users can create messages"
  ON messages
  FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- Policy for updating messages
CREATE POLICY "Users can update their received messages"
  ON messages
  FOR UPDATE
  USING (
    recipient_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    recipient_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );