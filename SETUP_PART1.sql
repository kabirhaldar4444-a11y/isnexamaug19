-- ============================================================
--  PART 1 — Run this FIRST, then create users via Dashboard
-- ============================================================
--  This only creates the profiles table + trigger so that
--  Supabase Dashboard "Add User" works without errors.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop old trigger and function if they exist (with CASCADE)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create profiles table (minimum needed for trigger)
CREATE TABLE IF NOT EXISTS public.profiles (
  id                uuid  REFERENCES auth.users NOT NULL PRIMARY KEY,
  email             text,
  full_name         text,
  phone             text,
  address           text,
  aadhaar_front_url text,
  aadhaar_back_url  text,
  profile_photo_url text,
  profile_completed boolean DEFAULT false,
  role              text CHECK (role IN ('admin', 'candidate')) DEFAULT 'candidate',
  is_exam_locked    boolean DEFAULT false,
  allotted_exam_ids uuid[]  DEFAULT '{}',
  ip_address        text,
  can_register      boolean DEFAULT true
);

-- Disable RLS temporarily so trigger can insert without restriction
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Create trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'candidate')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ✅ PART 1 DONE.
-- Now go to Supabase Dashboard → Authentication → Users
-- Click "Add user" → "Create new user"
-- Create:
--   info@isuccessnode.com   / qwerty@123   (check Auto confirm)
--   staffadmin@gmail.com    / ABC123       (check Auto confirm)
-- Then run PART 2 SQL below.
-- ============================================================
