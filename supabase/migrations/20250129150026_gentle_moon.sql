/*
  # Add OTP and Enhanced Settings

  1. New Tables
    - `user_otp_settings`
      - `user_id` (uuid, references auth.users)
      - `two_factor_enabled` (boolean)
      - `backup_codes` (text array)
      - `recovery_email` (text)
    - `user_preferences`
      - `user_id` (uuid, references auth.users)
      - `language` (text)
      - `timezone` (text)
      - `theme` (text)
      - `vacation_responder_enabled` (boolean)
      - `vacation_responder_message` (text)
      - `email_forwarding` (text)
  
  2. Security
    - Enable RLS on new tables
    - Add policies for authenticated users
*/

-- Create OTP settings table
CREATE TABLE IF NOT EXISTS user_otp_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  two_factor_enabled boolean DEFAULT false,
  backup_codes text[] DEFAULT ARRAY[]::text[],
  recovery_email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create user preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  language text DEFAULT 'en',
  timezone text DEFAULT 'UTC',
  theme text DEFAULT 'light',
  vacation_responder_enabled boolean DEFAULT false,
  vacation_responder_message text,
  email_forwarding text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_otp_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Policies for user_otp_settings
CREATE POLICY "Users can manage their own OTP settings"
  ON user_otp_settings
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for user_preferences
CREATE POLICY "Users can manage their own preferences"
  ON user_preferences
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON user_otp_settings TO authenticated;
GRANT ALL ON user_preferences TO authenticated;