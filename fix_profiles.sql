-- Add missing columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS aadhaar_front_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS aadhaar_back_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_photo_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_completed boolean default false;

-- Update RLS policies for exams to be more robust
DROP POLICY IF EXISTS "Anyone can view exams" ON public.exams;
DROP POLICY IF EXISTS "Admins can manage exams" ON public.exams;

CREATE POLICY "Anyone can view exams" ON public.exams FOR SELECT USING (true);
CREATE POLICY "Admins can manage exams" ON public.exams FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Ensure profiles are updated for existing admin
UPDATE public.profiles SET role = 'admin' WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'info@isuccessnode.com'
);
