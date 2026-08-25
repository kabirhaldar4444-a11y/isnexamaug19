-- ============================================================
-- SQL SCRIPT: CREATE STAFF ADMIN & REPAIR ADMIN METADATA
-- ============================================================
-- Run this in your Supabase SQL Editor. It will:
-- 1. Create the staffadmin@gmail.com account with the password ABC123.
-- 2. Repair info@isuccessnode.com's metadata so they have the admin role.

DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
  target_email text := 'staffadmin@gmail.com';
  target_password text := 'ABC123';
  encrypted_pw text;
BEGIN
  -- 1. REPAIR MASTER ADMIN METADATA (CRITICAL FOR RPC PRIVILEGES)
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'info@isuccessnode.com') THEN
    UPDATE auth.users 
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role":"admin","full_name":"Super Admin"}'::jsonb
    WHERE email = 'info@isuccessnode.com';

    UPDATE public.profiles 
    SET role = 'admin', full_name = 'Super Admin', profile_completed = true 
    WHERE email = 'info@isuccessnode.com';
    
    RAISE NOTICE 'Master admin metadata successfully repaired!';
  END IF;

  -- 2. CREATE STAFF ADMIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = target_email) THEN
    RAISE NOTICE 'User % already exists. Updating profile...', target_email;
    UPDATE public.profiles SET role = 'admin', full_name = 'Staff Admin', profile_completed = true WHERE email = target_email;
    UPDATE auth.users SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb WHERE email = target_email;
  ELSE
    encrypted_pw := crypt(target_password, gen_salt('bf', 10));

    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, is_super_admin
    ) VALUES (
      new_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      target_email, encrypted_pw,
      now(),
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
      jsonb_build_object('role', 'admin', 'full_name', 'Staff Admin'),
      now(), now(), false
    );

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), new_user_id,
      jsonb_build_object('sub', new_user_id::text, 'email', target_email),
      'email', target_email,
      now(), now(), now()
    );

    INSERT INTO public.profiles (id, email, full_name, role, profile_completed)
    VALUES (new_user_id, target_email, 'Staff Admin', 'admin', true)
    ON CONFLICT (id) DO UPDATE SET
      role = 'admin', email = target_email, full_name = 'Staff Admin', profile_completed = true;

    RAISE NOTICE 'Staff Admin account % successfully created!', target_email;
  END IF;
END $$;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
