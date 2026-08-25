-- ==========================================
-- CANDIDATE DATABASE UI FIX (REFINED)
-- ==========================================
-- This script adds is_exam_locked to the profiles table.
-- 'is_exam_locked' will control both the ability to take exams
-- AND the visibility of marks for completed tests.

DO $$
BEGIN
    -- 1. Add is_exam_locked column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_exam_locked') THEN
        ALTER TABLE public.profiles ADD COLUMN is_exam_locked boolean DEFAULT false;
    END IF;

    -- 2. Ensure exams_allotted exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'exams_allotted') THEN
        ALTER TABLE public.profiles ADD COLUMN exams_allotted integer DEFAULT 0;
    END IF;
END $$;

-- Reload Cache
NOTIFY pgrst, 'reload schema';
