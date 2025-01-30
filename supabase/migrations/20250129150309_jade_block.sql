/*
  # Add Email Features

  1. Updates to Messages Table
    - Add `parent_id` for reply chains
    - Add `forward_id` for forwarded messages
    - Add `draft` status
    - Add `labels` for organization
    - Add `attachments` support (URLs only)

  2. Security
    - Update existing policies
    - Add new policies for drafts
*/

-- Add new columns to messages table
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES messages(id),
ADD COLUMN IF NOT EXISTS forward_id uuid REFERENCES messages(id),
ADD COLUMN IF NOT EXISTS is_draft boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS labels text[] DEFAULT ARRAY[]::text[],
ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_messages_parent_id ON messages(parent_id);
CREATE INDEX IF NOT EXISTS idx_messages_forward_id ON messages(forward_id);

-- Update policies for drafts
CREATE POLICY "Users can manage their drafts"
  ON messages
  FOR ALL
  USING (
    (sender_id = auth.uid() AND is_draft = true) OR
    (recipient_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  )
  WITH CHECK (
    (sender_id = auth.uid() AND is_draft = true) OR
    (recipient_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );