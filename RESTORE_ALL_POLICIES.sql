-- ============================================================
-- MASTER FIX: RESTORE ALL RLS POLICIES + ADMIN PERMISSIONS
-- ============================================================
-- Run this in Supabase SQL Editor (New Query).
-- This is the ONE complete script that fixes everything:
--   1. Safe get_user_role() function
--   2. Profiles RLS (admin can see ALL users)
--   3. Exams RLS (admin can INSERT/UPDATE/DELETE)
--   4. Questions RLS (admin can INSERT/UPDATE/DELETE)
--   5. Admin metadata repair
-- ============================================================


-- STEP 1: Drop and recreate get_user_role() safely
-- NOTE: CASCADE also drops all dependent policies — we recreate them all below.
DROP FUNCTION IF EXISTS public.get_user_role() CASCADE;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
DECLARE
  u_role text;
BEGIN
  -- A. Read from JWT claims (fastest — no DB hit)
  u_role := auth.jwt() -> 'user_metadata' ->> 'role';
  IF u_role IS NOT NULL THEN
    RETURN u_role;
  END IF;

  -- B. Fallback: read from auth.users (bypasses profiles RLS completely)
  SELECT COALESCE(raw_user_meta_data->>'role', 'candidate')
    INTO u_role
    FROM auth.users
    WHERE id = auth.uid()
    LIMIT 1;

  RETURN COALESCE(u_role, 'candidate');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- STEP 2: Repair admin metadata in auth.users
-- (So JWT contains role:admin on next login)
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
  || '{"role":"admin","full_name":"Super Admin"}'::jsonb
WHERE email = 'info@isuccessnode.com';

UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
  || '{"role":"admin","full_name":"Staff Admin"}'::jsonb
WHERE email = 'staffadmin@gmail.com';

-- Also sync the profiles table role column
UPDATE public.profiles SET role = 'admin' WHERE email = 'info@isuccessnode.com';
UPDATE public.profiles SET role = 'admin' WHERE email = 'staffadmin@gmail.com';


-- STEP 3: Recreate ALL profiles RLS policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile"  ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles"       ON public.profiles;
DROP POLICY IF EXISTS "Allow profile insert"               ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles"     ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete all profiles"     ON public.profiles;

-- Candidates can see their own profile
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Admins can see ALL profiles (this is why the user list was empty)
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.get_user_role() = 'admin');

-- Anyone can insert a profile (needed for auto-trigger on signup)
CREATE POLICY "Allow profile insert"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admins can update any profile
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.get_user_role() = 'admin');

-- Admins can delete any profile
CREATE POLICY "Admins can delete all profiles"
  ON public.profiles FOR DELETE
  USING (public.get_user_role() = 'admin');


-- STEP 4: Recreate ALL exams RLS policies
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view exams"    ON public.exams;
DROP POLICY IF EXISTS "Admins can manage exams"  ON public.exams;
DROP POLICY IF EXISTS "Admins can insert exams"  ON public.exams;
DROP POLICY IF EXISTS "Admins can update exams"  ON public.exams;
DROP POLICY IF EXISTS "Admins can delete exams"  ON public.exams;

CREATE POLICY "Anyone can view exams"
  ON public.exams FOR SELECT USING (true);

CREATE POLICY "Admins can insert exams"
  ON public.exams FOR INSERT
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Admins can update exams"
  ON public.exams FOR UPDATE
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Admins can delete exams"
  ON public.exams FOR DELETE
  USING (public.get_user_role() = 'admin');


-- STEP 5: Recreate ALL questions RLS policies
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view questions"    ON public.questions;
DROP POLICY IF EXISTS "Admins can manage questions"  ON public.questions;
DROP POLICY IF EXISTS "Admins can insert questions"  ON public.questions;
DROP POLICY IF EXISTS "Admins can update questions"  ON public.questions;
DROP POLICY IF EXISTS "Admins can delete questions"  ON public.questions;

CREATE POLICY "Anyone can view questions"
  ON public.questions FOR SELECT USING (true);

CREATE POLICY "Admins can insert questions"
  ON public.questions FOR INSERT
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Admins can update questions"
  ON public.questions FOR UPDATE
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Admins can delete questions"
  ON public.questions FOR DELETE
  USING (public.get_user_role() = 'admin');


-- STEP 6: Submissions policies (in case they were dropped too)
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Users can view their own submissions"   ON public.submissions;
DROP POLICY IF EXISTS "Admins can manage submissions"          ON public.submissions;

CREATE POLICY "Users can insert their own submissions"
  ON public.submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own submissions"
  ON public.submissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage submissions"
  ON public.submissions FOR ALL
  USING (public.get_user_role() = 'admin');


-- STEP 7: Reload schema cache
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- DONE! After running:
-- 1. Log OUT from the admin dashboard
-- 2. Log back IN as info@isuccessnode.com / qwerty@123
-- 3. All users will be visible + exam creation works
-- ============================================================
