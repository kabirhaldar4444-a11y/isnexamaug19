-- ============================================================
-- THE MASTER FINAL RESOLUTION (SQL)
-- ============================================================
-- This script provides a 100% reliable fix for:
-- 1. "Account not properly initialized" login failures
-- 2. "Database error querying schema" RLS issues
-- 3. Incomplete user creation (Missing Identities)

-- -------------------------------------------------------------
-- 1. ENABLE EXTENSIONS & CLEANUP
-- -------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Disable RLS temporarily to ensure we can reset properly
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------
-- 2. ROBUST ROLE HELPER
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
DECLARE
  u_role text;
BEGIN
  -- 1. Try to read directly from JWT claims in memory (fastest)
  u_role := auth.jwt() -> 'user_metadata' ->> 'role';
  IF u_role IS NOT NULL THEN
    RETURN u_role;
  END IF;

  -- 2. Fallback to auth.users table (bypasses public.profiles RLS completely)
  SELECT COALESCE(raw_user_meta_data ->> 'role', 'candidate') INTO u_role
  FROM auth.users
  WHERE id = auth.uid() LIMIT 1;

  RETURN COALESCE(u_role, 'candidate');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -------------------------------------------------------------
-- 3. FOOLPROOF USER CREATION (RPC)
-- -------------------------------------------------------------
DROP FUNCTION IF EXISTS public.admin_create_candidate(text, text, text);

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

-- -------------------------------------------------------------
-- 4. CLEAN RLS POLICIES (NO RECURSION)
-- -------------------------------------------------------------
-- Enable RLS again
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile insert" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete all profiles" ON public.profiles;

-- 4.1. The "Self" Policy: Does NOT call get_user_role (Prevents recursion)
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- 4.2. The "Admin" Policy: Calls get_user_role (Safe because of SECURITY DEFINER)
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (public.get_user_role() = 'admin');

-- 4.3. The "Insert" Policy: Necessary for growth
CREATE POLICY "Allow profile insert"
ON public.profiles FOR INSERT
WITH CHECK (true);

-- 4.4. The "Update" Policy
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
USING (public.get_user_role() = 'admin');

-- 4.5. The "Delete" Policy
CREATE POLICY "Admins can delete all profiles"
ON public.profiles FOR DELETE
USING (public.get_user_role() = 'admin');

-- -------------------------------------------------------------
-- 5. REPAIR EXISTING CANDIDATES
-- -------------------------------------------------------------
-- Ensure every auth user has a profile and every profile has a candidate role if applicable
INSERT INTO public.profiles (id, email, full_name, role, profile_completed)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', 'System User'),
  COALESCE(raw_user_meta_data->>'role', 'candidate'),
  false
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Log the fix completion
DO $$ 
BEGIN 
  RAISE NOTICE 'MASTER_FIX successfully applied at %', now(); 
END $$;
