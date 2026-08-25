-- ============================================================
-- SQL PATCH: FIX CANDIDATE LOGIN & AUTH FIELDS (PERMANENT FIX)
-- ============================================================
-- Run this in your Supabase SQL Editor. It will:
-- 1. Fix all existing users in auth.users by filling required empty string columns.
-- 2. Update the admin_create_candidate function to write these fields properly for new users.

-- 1. REPAIR ALL EXISTING USERS IN THE SYSTEM
UPDATE auth.users
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  reauthentication_token = COALESCE(reauthentication_token, ''),
  email_change_token_current = COALESCE(email_change_token_current, '');

-- 2. REDEFINE THE USER CREATION RPC WITH EXPLICIT DEFAULT FIELDS
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

  -- Insert into auth.users (populating confirmation/token fields with empty strings for GoTrue compatibility)
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, is_super_admin,
    confirmation_token, recovery_token, email_change_token_new,
    email_change, phone_change, phone_change_token,
    reauthentication_token, email_change_token_current
  ) VALUES (
    new_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    normalized_email,
    crypt(candidate_password, gen_salt('bf', 10)),
    now(),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    jsonb_build_object('role', 'candidate', 'full_name', candidate_name),
    now(), now(), false,
    '', '', '',
    '', '', '',
    '', ''
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

-- 3. RELOAD SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
