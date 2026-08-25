-- ==========================================
-- ADMIN UPDATE CANDIDATE RPC
-- ==========================================
-- This function allows admins to edit a candidate's:
-- 1. Email (Auth & Profile)
-- 2. Password (Auth)
-- 3. Full Name (Profile)
-- 4. Exams Allotted (Profile)

CREATE OR REPLACE FUNCTION public.admin_update_candidate(
  target_user_id uuid,
  new_email text,
  new_password text DEFAULT NULL,
  new_name text DEFAULT NULL,
  new_exams_allotted integer DEFAULT NULL
) RETURNS void AS $$
DECLARE
  encrypted_pw text;
BEGIN
  -- 1. Check if caller is admin
  IF public.get_user_role() != 'admin' THEN
    RAISE EXCEPTION 'Not authorized to update candidates';
  END IF;

  -- 2. Update auth.users email
  UPDATE auth.users SET email = new_email WHERE id = target_user_id;
  
  -- 3. Update auth.users password if provided
  IF new_password IS NOT NULL AND new_password != '' THEN
    encrypted_pw := crypt(new_password, gen_salt('bf', 10));
    UPDATE auth.users SET encrypted_password = encrypted_pw WHERE id = target_user_id;
  END IF;

  -- 4. Update public.profiles
  UPDATE public.profiles SET 
    full_name = COALESCE(new_name, full_name),
    email = new_email,
    exams_allotted = COALESCE(new_exams_allotted, exams_allotted)
  WHERE id = target_user_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
