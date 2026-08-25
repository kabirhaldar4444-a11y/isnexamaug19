-- ==========================================
-- FINAL DATABASE SCHEMA FIX (COMPATIBILITY MODE)
-- ==========================================
-- Run this in your Supabase SQL Editor.
-- This uses a DO block to safely handle column renames and additions.

DO $$
BEGIN
    -- 1. Fix Questions Table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'text') THEN
        ALTER TABLE public.questions RENAME COLUMN text TO question_text;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'correct_answer') THEN
        ALTER TABLE public.questions RENAME COLUMN correct_answer TO correct_option;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'explanation') THEN
        ALTER TABLE public.questions ADD COLUMN explanation text;
    END IF;

    -- 2. Fix Submissions Table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'candidate_id') THEN
        ALTER TABLE public.submissions RENAME COLUMN candidate_id TO user_id;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'answers') THEN
        ALTER TABLE public.submissions ADD COLUMN answers jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'is_released') THEN
        ALTER TABLE public.submissions ADD COLUMN is_released boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'admin_score_override') THEN
        ALTER TABLE public.submissions ADD COLUMN admin_score_override integer;
    END IF;
END $$;

-- 3. Reload Cache
NOTIFY pgrst, 'reload schema';
