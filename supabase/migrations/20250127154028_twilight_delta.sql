/*
  # Create user profiles table and permissions
  
  1. Changes
    - Create a secure user_profiles table instead of a view
    - Set up proper RLS policies for the table
    - Create a function to automatically sync profiles with auth.users
  
  2. Security
    - Only exposes necessary user information
    - Ensures data is always in sync with auth.users
    - Restricts access through RLS policies
*/

-- Create the user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on the profiles table
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to read profiles
CREATE POLICY "Users can view all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Create function to sync profiles with auth.users
CREATE OR REPLACE FUNCTION sync_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    display_name = COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger to automatically sync profiles
DROP TRIGGER IF EXISTS sync_user_profile ON auth.users;
CREATE TRIGGER sync_user_profile
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_profile();

-- Sync existing users
INSERT INTO public.user_profiles (id, email, display_name)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', email) as display_name
FROM auth.users
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  display_name = EXCLUDED.display_name,
  updated_at = now();