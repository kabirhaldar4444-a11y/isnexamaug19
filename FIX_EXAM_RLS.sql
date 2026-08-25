-- ============================================================
-- SQL PATCH: FIX EXAM & QUESTION INSERT/WRITE PERMISSIONS
-- ============================================================
-- Run this in your Supabase SQL Editor.
-- This fixes the RLS policies on exams and questions tables
-- so that admins can INSERT, UPDATE, and DELETE exams/questions.
-- ============================================================

-- STEP 1: Ensure get_user_role() is the SAFE non-recursive version
-- (Does NOT query public.profiles — reads from JWT or auth.users instead)
DROP FUNCTION IF EXISTS public.get_user_role() CASCADE;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
DECLARE
  u_role text;
BEGIN
  -- A. Read from JWT claims first (fastest, no DB hit)
  u_role := auth.jwt() -> 'user_metadata' ->> 'role';
  IF u_role IS NOT NULL THEN
    RETURN u_role;
  END IF;

  -- B. Fallback: read from auth.users raw_user_meta_data (bypasses profiles RLS)
  SELECT COALESCE(raw_user_meta_data->>'role', 'candidate')
    INTO u_role
    FROM auth.users
    WHERE id = auth.uid()
    LIMIT 1;

  RETURN COALESCE(u_role, 'candidate');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- STEP 2: Drop and recreate Exams RLS policies
-- The FOR ALL policy needs separate INSERT WITH CHECK instead of just USING

DROP POLICY IF EXISTS "Anyone can view exams"    ON public.exams;
DROP POLICY IF EXISTS "Admins can manage exams"  ON public.exams;
DROP POLICY IF EXISTS "Admins can insert exams"  ON public.exams;
DROP POLICY IF EXISTS "Admins can update exams"  ON public.exams;
DROP POLICY IF EXISTS "Admins can delete exams"  ON public.exams;

-- Allow everyone to read exams (needed for candidates to see their assigned exam)
CREATE POLICY "Anyone can view exams"
  ON public.exams FOR SELECT USING (true);

-- Admins can INSERT new exams
CREATE POLICY "Admins can insert exams"
  ON public.exams FOR INSERT
  WITH CHECK (public.get_user_role() = 'admin');

-- Admins can UPDATE exams
CREATE POLICY "Admins can update exams"
  ON public.exams FOR UPDATE
  USING (public.get_user_role() = 'admin');

-- Admins can DELETE exams
CREATE POLICY "Admins can delete exams"
  ON public.exams FOR DELETE
  USING (public.get_user_role() = 'admin');


-- STEP 3: Drop and recreate Questions RLS policies

DROP POLICY IF EXISTS "Anyone can view questions"    ON public.questions;
DROP POLICY IF EXISTS "Admins can manage questions"  ON public.questions;
DROP POLICY IF EXISTS "Admins can insert questions"  ON public.questions;
DROP POLICY IF EXISTS "Admins can update questions"  ON public.questions;
DROP POLICY IF EXISTS "Admins can delete questions"  ON public.questions;

-- Allow everyone to read questions (needed during exam taking)
CREATE POLICY "Anyone can view questions"
  ON public.questions FOR SELECT USING (true);

-- Admins can INSERT new questions
CREATE POLICY "Admins can insert questions"
  ON public.questions FOR INSERT
  WITH CHECK (public.get_user_role() = 'admin');

-- Admins can UPDATE questions
CREATE POLICY "Admins can update questions"
  ON public.questions FOR UPDATE
  USING (public.get_user_role() = 'admin');

-- Admins can DELETE questions
CREATE POLICY "Admins can delete questions"
  ON public.questions FOR DELETE
  USING (public.get_user_role() = 'admin');


-- STEP 4: Ensure admin metadata is set correctly for info@isuccessnode.com
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
  || '{"role": "admin"}'::jsonb
WHERE email = 'info@isuccessnode.com';

-- Also for staffadmin if it exists
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
  || '{"role": "admin"}'::jsonb
WHERE email = 'staffadmin@gmail.com';


-- STEP 5: Reload schema cache
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- DONE. Now:
-- 1. Log OUT of the admin dashboard
-- 2. Log back IN as info@isuccessnode.com
-- 3. Try creating an exam — it will work!
-- ============================================================
