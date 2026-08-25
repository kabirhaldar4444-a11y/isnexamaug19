-- ============================================================
-- SQL PATCH: ADD MISSING COLUMNS TO PROFILES TABLE
-- ============================================================
-- Run this script in your Supabase SQL Editor to add the columns
-- needed for T&C acceptance and KYC profile completion.

DO $$
BEGIN
    -- 1. Add disclaimer_accepted column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'disclaimer_accepted') THEN
        ALTER TABLE public.profiles ADD COLUMN disclaimer_accepted boolean DEFAULT false;
    END IF;

    -- 2. Add pan_url column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'pan_url') THEN
        ALTER TABLE public.profiles ADD COLUMN pan_url text;
    END IF;

    -- 3. Add signature_url column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'signature_url') THEN
        ALTER TABLE public.profiles ADD COLUMN signature_url text;
    END IF;
END $$;

-- Reload schema cache to make columns visible to PostgREST immediately
NOTIFY pgrst, 'reload schema';
