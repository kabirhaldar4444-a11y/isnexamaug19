-- ==========================================
-- FIX EXAM DELETION
-- ==========================================
-- This script ensures that when an exam is deleted, all associated submissions are also deleted.
-- This prevents foreign key constraint errors during deletion.

-- 1. Drop existing foreign key constraint if it exists (might be named differently, so we use a safe approach)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'submissions_exam_id_fkey') THEN
        ALTER TABLE public.submissions DROP CONSTRAINT submissions_exam_id_fkey;
    END IF;
END $$;

-- 2. Add the constraint back with ON DELETE CASCADE
ALTER TABLE public.submissions 
ADD CONSTRAINT submissions_exam_id_fkey 
FOREIGN KEY (exam_id) 
REFERENCES public.exams(id) 
ON DELETE CASCADE;
