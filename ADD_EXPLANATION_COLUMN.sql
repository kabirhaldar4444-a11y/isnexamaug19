-- ==========================================
-- ADD EXPLANATION COLUMN TO QUESTIONS
-- ==========================================
-- Run this in your Supabase SQL Editor to support the new Excel upload format.

ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS explanation text;

-- No RLS changes needed as the existing "Admins can manage questions" covers all columns.
