-- ==========================================
-- FIX CANDIDATE LOGIN RPC
-- ==========================================
-- This script fixes the admin_create_candidate RPC to ensure compatibility with Supabase Auth (GoTrue).

CREATE OR REPLACE FUNCTION public.admin_create_candidate(
  candidate_email text,
  candidate_password text,
  candidate_name text
) RETURNS uuid AS $$
DECLARE
  new_user_id uuid;
  encrypted_pw text;
BEGIN
  -- 1. Check if caller is admin
  IF public.get_user_role() != 'admin' THEN
    RAISE EXCEPTION 'Not authorized to create candidates';
  END IF;

  -- 2. Check if email exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = candidate_email) THEN
    RAISE EXCEPTION 'User with this email already exists';
  END IF;

  new_user_id := gen_random_uuid();
  -- Use crypt with bf (bcrypt) which is what Supabase Auth expects
  encrypted_pw := crypt(candidate_password, gen_salt('bf', 10));

  -- 3. Insert into auth.users
  INSERT INTO auth.users (
    instance_id, 
    id, 
    aud, 
    role, 
    email, 
    encrypted_password, 
    email_confirmed_at, 
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data, 
    raw_user_meta_data, 
    is_super_admin,
    created_at, 
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    is_sso_user,
    deleted_at,
    is_anonymous
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', 
    new_user_id, 
    'authenticated', 
    'authenticated', 
    candidate_email, 
    encrypted_pw,
    now(), 
    NULL, '', NULL, '', NULL, '', '', NULL, NULL,
    '{"provider":"email","providers":["email"]}'::jsonb, 
    format('{"role":"candidate","full_name":"%s"}', candidate_name)::jsonb,
    false,
    now(), 
    now(),
    NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false
  );

  -- 4. Identity record (CRITICAL for login)
  INSERT INTO auth.identities (
    id,
    user_id, 
    identity_data,
    provider,
    provider_id,
    last_sign_in_at, 
    created_at, 
    updated_at
  ) VALUES (
    gen_random_uuid(), -- Identity ID should be unique
    new_user_id, 
    format('{"sub":"%s","email":"%s"}', new_user_id::text, candidate_email)::jsonb, 
    'email',
    candidate_email, -- provider_id for email is the email itself
    now(), 
    now(), 
    now()
  );

  -- 5. Profile record
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new_user_id, candidate_email, candidate_name, 'candidate');

  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
