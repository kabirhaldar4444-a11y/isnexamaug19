-- ==========================================
-- SUBMISSIONS TABLE SCHEMA FIX
-- ==========================================
-- Run this in your Supabase SQL Editor to fix the "is_released" column error.

-- 1. Ensure submissions table has all required columns
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS is_released BOOLEAN DEFAULT false;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS admin_score_override INTEGER;

-- 2. Ensure RLS is enabled
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Users can insert their own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Users can view their own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Admins can manage submissions" ON public.submissions;

-- 4. Re-create clean policies
CREATE POLICY "Users can insert their own submissions" 
ON public.submissions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own submissions" 
ON public.submissions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage submissions" 
ON public.submissions FOR ALL 
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 5. Refresh schema cache (Implicit when running this SQL)
-- PostgREST will automatically detect these changes.
