-- ==========================================
-- MASTER DATABASE CORRECTION (ALLOTTED EXAMS)
-- ==========================================
-- INSTRUCTIONS: 
-- 1. Copy and Run this in your Supabase SQL Editor.
-- 2. It enables the specific exam allotment feature.

DO $$
BEGIN
    -- 1. ADD allotted_exam_ids to profiles
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'allotted_exam_ids') THEN
        ALTER TABLE public.profiles ADD COLUMN allotted_exam_ids uuid[] DEFAULT '{}'::uuid[];
    END IF;
END $$;

-- 2. UPDATE RPC TO HANDLE EXAM IDS
-- Drop older overloaded versions to prevent Ambiguous Function exceptions
DROP FUNCTION IF EXISTS public.admin_update_candidate(uuid, text, text, text, integer, uuid[]);
DROP FUNCTION IF EXISTS public.admin_update_candidate(uuid, text, text, text, uuid[]);

CREATE OR REPLACE FUNCTION public.admin_update_candidate(
  target_user_id uuid,
  new_email text,
  new_password text DEFAULT NULL,
  new_name text DEFAULT NULL,
  new_allotted_exam_ids uuid[] DEFAULT NULL
) RETURNS void AS $$
DECLARE
  encrypted_pw text;
BEGIN
  -- 1. Check if caller is admin
  IF public.get_user_role() != 'admin' THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- 2. Update auth.users
  UPDATE auth.users SET email = new_email WHERE id = target_user_id;
  
  IF new_password IS NOT NULL AND new_password != '' THEN
    encrypted_pw := crypt(new_password, gen_salt('bf', 10));
    UPDATE auth.users SET encrypted_password = encrypted_pw WHERE id = target_user_id;
  END IF;

  -- 3. Update public.profiles
  UPDATE public.profiles SET 
    full_name = COALESCE(new_name, full_name),
    email = new_email,
    allotted_exam_ids = COALESCE(new_allotted_exam_ids, allotted_exam_ids)
  WHERE id = target_user_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

NOTIFY pgrst, 'reload schema';
