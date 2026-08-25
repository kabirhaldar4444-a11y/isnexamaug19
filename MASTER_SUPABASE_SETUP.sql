-- ============================================================
-- MASTER SUPABASE SETUP SCRIPT (isuccessnode EXAM PORTAL)
-- ============================================================
-- Run this in your Supabase SQL Editor to fix ALL issues:
-- 1. Admin/Candidate Login
-- 2. Candidate Registration Flow
-- 3. Admin Visibility of Candidates
-- 4. Storage Buckets & Permissions

-- 1. CLEANUP OLD POLICIES (To prevent conflicts)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Anyone can view exams" ON public.exams;
    DROP POLICY IF EXISTS "Admins can manage exams" ON public.exams;
    DROP POLICY IF EXISTS "Anyone can view questions" ON public.questions;
    DROP POLICY IF EXISTS "Admins can manage questions" ON public.questions;
EXCEPTION WHEN others THEN NULL;
END $$;

-- 2. TABLES CREATION / UPDATES
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  phone text,
  address text,
  aadhaar_front_url text,
  aadhaar_back_url text,
  profile_photo_url text,
  profile_completed boolean default false,
  role text check (role in ('admin', 'candidate'))
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

-- 3. ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Helper function to avoid recursive RLS checks
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Exams Policies
CREATE POLICY "Anyone can view exams" ON public.exams FOR SELECT USING (true);
CREATE POLICY "Admins can manage exams" ON public.exams FOR ALL USING (public.get_user_role() = 'admin');

-- Questions Policies
CREATE POLICY "Anyone can view questions" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Admins can manage questions" ON public.questions FOR ALL USING (public.get_user_role() = 'admin');

-- Submissions Policies
CREATE POLICY "Users can insert their own submissions" ON public.submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own submissions" ON public.submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage submissions" ON public.submissions FOR ALL USING (public.get_user_role() = 'admin');

-- 4. RPC: ADMIN CREATE CANDIDATE
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.admin_create_candidate(
  candidate_email text,
  candidate_password text,
  candidate_name text
) RETURNS uuid AS $$
DECLARE
  new_user_id uuid;
  encrypted_pw text;
BEGIN
  -- 1. Check if caller is admin
  IF public.get_user_role() != 'admin' THEN
    RAISE EXCEPTION 'Not authorized to create candidates';
  END IF;

  -- 2. Check if email exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = candidate_email) THEN
    RAISE EXCEPTION 'User with this email already exists';
  END IF;

  new_user_id := gen_random_uuid();
  encrypted_pw := crypt(candidate_password, gen_salt('bf', 10));

  -- 3. Insert into auth.users 
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
    created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated', candidate_email, encrypted_pw,
    now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"role":"candidate"}'::jsonb, 
    now(), now(), '', '', '', ''
  );

  -- 4. Identity record
  INSERT INTO auth.identities (
    id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) VALUES (
    new_user_id, new_user_id, new_user_id::text, format('{"sub":"%s","email":"%s"}', new_user_id::text, candidate_email)::jsonb, 'email', now(), now(), now()
  );

  -- 5. Profile record
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new_user_id, candidate_email, candidate_name, 'candidate');

  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. REPAIR ADMIN USER (if exists)
DO $$
DECLARE
  target_email text := 'info@isuccessnode.com';
  user_id uuid;
BEGIN
  SELECT id INTO user_id FROM auth.users WHERE email = target_email;
  IF user_id IS NOT NULL THEN
    UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"role":"admin"}'::jsonb WHERE id = user_id;
    INSERT INTO public.profiles (id, full_name, role, email)
    VALUES (user_id, 'System Admin', 'admin', target_email)
    ON CONFLICT (id) DO UPDATE SET role = 'admin', email = target_email;
  END IF;
END $$;

-- 6. STORAGE BUCKETS & POLICIES
INSERT INTO storage.buckets (id, name, public)
VALUES ('aadhaar_cards', 'aadhaar_cards', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'aadhaar_cards');

DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'aadhaar_cards');

DROP POLICY IF EXISTS "Owner Access" ON storage.objects;
CREATE POLICY "Owner Access" ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'aadhaar_cards');
