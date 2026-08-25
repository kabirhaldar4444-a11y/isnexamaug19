-- ==========================================
-- ADD LOCKED RESULTS & SCORE OVERRIDE
-- ==========================================

-- 1. Update submissions table
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS is_released BOOLEAN DEFAULT false;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS admin_score_override INTEGER;

-- 2. Ensure RLS allows admin to update these columns
DROP POLICY IF EXISTS "Admins can manage submissions" ON public.submissions;
CREATE POLICY "Admins can manage submissions" ON public.submissions FOR ALL 
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
