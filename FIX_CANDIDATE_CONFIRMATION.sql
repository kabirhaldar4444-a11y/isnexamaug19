-- ============================================================
-- SQL PATCH: FIX CANDIDATE EMAIL CONFIRMATION (REVISED)
-- ============================================================
-- Run this script in the Supabase SQL Editor to:
-- 1. Fix the 'Email not confirmed' error for the existing candidate user03@gmail.com
-- 2. Update the admin_create_candidate function so future users are automatically confirmed.

-- -------------------------------------------------------------
-- 1. CONFIRM EXISTING CANDIDATE USER (Omit confirmed_at since it is generated)
-- -------------------------------------------------------------
UPDATE auth.users 
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  instance_id = '00000000-0000-0000-0000-000000000000'
WHERE email = 'user03@gmail.com';

-- -------------------------------------------------------------
-- 2. UPDATE RPC TO AUTO-CONFIRM FUTURE USERS
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_create_candidate(
  candidate_email    text,
  candidate_password text,
  candidate_name     text
) RETURNS uuid AS $$
DECLARE
  new_user_id      uuid;
  normalized_email text;
BEGIN
  -- Security check
  IF public.get_user_role() != 'admin' THEN
    RAISE EXCEPTION 'Access Denied: Only administrators can create candidates';
  END IF;

  normalized_email := LOWER(TRIM(candidate_email));

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = normalized_email) THEN
    RAISE EXCEPTION 'A user with this email already exists: %', normalized_email;
  END IF;

  new_user_id := gen_random_uuid();

  -- Insert into auth.users (populating email_confirmed_at, omitting generated confirmed_at)
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, is_super_admin
  ) VALUES (
    new_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    normalized_email,
    crypt(candidate_password, gen_salt('bf', 10)),
    now(),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    jsonb_build_object('role', 'candidate', 'full_name', candidate_name),
    now(), now(), false
  );

  -- Insert into auth.identities
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), new_user_id,
    jsonb_build_object('sub', new_user_id::text, 'email', normalized_email),
    'email', normalized_email,
    now(), now(), now()
  );

  -- Insert into public.profiles
  INSERT INTO public.profiles (id, email, full_name, role, profile_completed)
  VALUES (new_user_id, normalized_email, candidate_name, 'candidate', false)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email, full_name = EXCLUDED.full_name, role = 'candidate';

  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
