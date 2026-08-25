-- ==========================================
-- FIX QUESTIONS VISIBILITY (RLS)
-- ==========================================
-- This script ensures that candidates can read questions for exams.

-- 1. Enable RLS on questions table
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- 2. Allow everyone (authenticated) to view questions
DROP POLICY IF EXISTS "Anyone can view questions" ON public.questions;
CREATE POLICY "Anyone can view questions" 
ON public.questions 
FOR SELECT 
USING (true);

-- 3. Allow admins to do everything
DROP POLICY IF EXISTS "Admins can manage questions" ON public.questions;
CREATE POLICY "Admins can manage questions" 
ON public.questions 
FOR ALL 
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 4. Verify RLS index
-- This ensures the database doesn't lag when checking roles
CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON public.profiles (id, role);
