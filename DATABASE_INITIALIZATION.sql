-- ============================================================
-- MASTER DATABASE INITIALIZATION SCRIPT (V2 - COMPREHENSIVE)
-- ============================================================
-- Run this in your Supabase SQL Editor to fix:
-- 1. "Account initialization incomplete" (Login)
-- 2. "Explanation column not found" (Add Question)
-- 3. "admin_delete_user function not found" (Delete User)
-- 4. "admin_update_candidate function not found" (Edit User)

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. TABLES SETUP
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  phone text,
  address text,
  aadhaar_front_url text,
  aadhaar_back_url text,
  pan_url text,
  profile_photo_url text,
  profile_completed boolean default false,
  role text check (role in ('admin', 'candidate')) DEFAULT 'candidate',
  is_exam_locked boolean DEFAULT false,
  allotted_exam_ids uuid[] DEFAULT '{}' -- Used for exam permissions
);

CREATE TABLE IF NOT EXISTS public.exams (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  duration integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

CREATE TABLE IF NOT EXISTS public.questions (
  id uuid default gen_random_uuid() primary key,
  exam_id uuid references public.exams on delete cascade not null,
  question_text text not null,
  options jsonb not null,
  correct_option integer not null,
  explanation text, -- MISSING FIX 1: Explanation column
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

CREATE TABLE IF NOT EXISTS public.submissions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  exam_id uuid references public.exams not null,
  score integer not null,
  total_questions integer not null,
  answers jsonb not null,
  is_released boolean default false,
  admin_score_override integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. ROLE HELPER FUNCTION
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
DECLARE
  u_role text;
BEGIN
  SELECT role INTO u_role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
  RETURN u_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RPC FUNCTIONS (ADMIN POWER TOOLS)

-- RPC: Delete User
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id uuid)
RETURNS json AS $$
DECLARE
    caller_role text;
BEGIN
    caller_role := public.get_user_role();
    IF caller_role != 'admin' THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can delete users';
    END IF;

    IF target_user_id = auth.uid() THEN
        RAISE EXCEPTION 'Safety Violation: You cannot delete your own account';
    END IF;

    -- Cleanup
    DELETE FROM public.submissions WHERE user_id = target_user_id;
    DELETE FROM public.profiles WHERE id = target_user_id;
    DELETE FROM auth.users WHERE id = target_user_id;

    RETURN json_build_object('success', true, 'message', 'User deleted successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Update Candidate
CREATE OR REPLACE FUNCTION public.admin_update_candidate(
  target_user_id uuid,
  new_email text,
  new_password text DEFAULT NULL,
  new_name text DEFAULT NULL,
  new_allotted_exam_ids uuid[] DEFAULT NULL
) RETURNS void AS $$
BEGIN
  IF public.get_user_role() != 'admin' THEN
    RAISE EXCEPTION 'Not authorized to update candidates';
  END IF;

  -- Update auth email
  UPDATE auth.users SET email = new_email WHERE id = target_user_id;
  
  -- Update auth password if provided
  IF new_password IS NOT NULL AND new_password != '' THEN
    UPDATE auth.users SET encrypted_password = crypt(new_password, gen_salt('bf', 10)) WHERE id = target_user_id;
  END IF;

  -- Update Profile
  UPDATE public.profiles SET 
    full_name = COALESCE(new_name, full_name),
    email = new_email,
    allotted_exam_ids = COALESCE(new_allotted_exam_ids, allotted_exam_ids)
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. AUTOMATIC PROFILE TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'System User'),
    COALESCE(new.raw_user_meta_data->>'role', 'candidate')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. REPAIR: ENSURE ALL USERS HAVE PROFILES
INSERT INTO public.profiles (id, email, full_name, role, profile_completed)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', 'System User'),
  COALESCE(raw_user_meta_data->>'role', 'candidate'),
  false
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 7. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;
CREATE POLICY "Admins can manage profiles" ON public.profiles FOR ALL USING (public.get_user_role() = 'admin');

-- Exams Policies
DROP POLICY IF EXISTS "Anyone can view exams" ON public.exams;
CREATE POLICY "Anyone can view exams" ON public.exams FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage exams" ON public.exams;
CREATE POLICY "Admins can manage exams" ON public.exams FOR ALL USING (public.get_user_role() = 'admin');

-- Questions Policies
DROP POLICY IF EXISTS "Anyone can view questions" ON public.questions;
CREATE POLICY "Anyone can view questions" ON public.questions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage questions" ON public.questions;
CREATE POLICY "Admins can manage questions" ON public.questions FOR ALL USING (public.get_user_role() = 'admin');

-- Submissions Policies
DROP POLICY IF EXISTS "Users can insert their own submissions" ON public.submissions;
CREATE POLICY "Users can insert their own submissions" ON public.submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can view their own submissions" ON public.submissions;
CREATE POLICY "Users can view their own submissions" ON public.submissions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can manage submissions" ON public.submissions;
CREATE POLICY "Admins can manage submissions" ON public.submissions FOR ALL USING (public.get_user_role() = 'admin');

-- 8. STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public)
VALUES ('aadhaar_cards', 'aadhaar_cards', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'aadhaar_cards');
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'aadhaar_cards');
DROP POLICY IF EXISTS "Owner Access" ON storage.objects;
CREATE POLICY "Owner Access" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'aadhaar_cards');

-- 9. ENSURE MASTER ADMIN EXISTS (info@isuccessnode.com)
UPDATE public.profiles SET role = 'admin' WHERE email = 'info@isuccessnode.com';
UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"role":"admin"}'::jsonb WHERE email = 'info@isuccessnode.com';
