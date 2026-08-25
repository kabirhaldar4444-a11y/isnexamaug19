-- ==========================================
-- RESTORE ORIGINAL STABLE DATABASE STRUCTURE
-- ==========================================
-- 1. Minimalist User Creation (Fixes "confirmed_at" error)
-- 2. Stable RLS Policies (Fixes "schema error")

-- 🛡️ Step 1: Clean RLS for Profile Visibility
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile insert" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles 
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles 
FOR SELECT USING (public.get_user_role() = 'admin');

CREATE POLICY "Allow profile insert" ON public.profiles 
FOR INSERT WITH CHECK (true);

-- 🛡️ Step 2: Robust Role Helper
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
DECLARE
  u_role text;
BEGIN
  SELECT role INTO u_role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
  RETURN u_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 🛡️ Step 3: Minimalist Create Candidate (Guaranteed no confirmed_at error)
DROP FUNCTION IF EXISTS public.admin_create_candidate(text, text, text);

CREATE OR REPLACE FUNCTION public.admin_create_candidate(
  candidate_email text,
  candidate_password text,
  candidate_name text
) RETURNS uuid AS $$
DECLARE
  new_user_id uuid;
  normalized_email text;
BEGIN
  IF public.get_user_role() != 'admin' THEN RAISE EXCEPTION 'Access Denied'; END IF;
  
  normalized_email := LOWER(TRIM(candidate_email));
  new_user_id := gen_random_uuid();

  -- Auth User: Bare minimum columns only to prevent DEFAULT value errors
  INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
  VALUES (new_user_id, 'authenticated', 'authenticated', normalized_email, crypt(candidate_password, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('role', 'candidate', 'full_name', candidate_name));

  -- Auth Identity: Mandatory for login
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id)
  VALUES (gen_random_uuid(), new_user_id, jsonb_build_object('sub', new_user_id, 'email', normalized_email), 'email', normalized_email);

  -- Public Profile
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new_user_id, normalized_email, candidate_name, 'candidate');

  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 🛡️ Step 4: Repair Data (Ensures existing new users get profiles)
INSERT INTO public.profiles (id, email, full_name, role)
SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', 'Student'), 'candidate'
FROM auth.users WHERE id NOT IN (SELECT id FROM public.profiles) ON CONFLICT (id) DO NOTHING;
