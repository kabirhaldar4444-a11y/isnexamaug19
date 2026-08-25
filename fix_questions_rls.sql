-- Update RLS policies for questions
DROP POLICY IF EXISTS "Anyone can view questions" ON public.questions;
DROP POLICY IF EXISTS "Admins can manage questions" ON public.questions;

CREATE POLICY "Anyone can view questions" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Admins can manage questions" ON public.questions FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
