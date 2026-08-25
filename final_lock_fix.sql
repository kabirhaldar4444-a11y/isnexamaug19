-- Update is_exam_locked to default to true (Locked)
ALTER TABLE public.profiles ALTER COLUMN is_exam_locked SET DEFAULT true;

-- Update all existing candidates to be locked by default
UPDATE public.profiles SET is_exam_locked = true WHERE role = 'candidate';

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
