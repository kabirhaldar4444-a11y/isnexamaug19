-- ============================================================
-- SQL PATCH: RESOLVE LOGIN RECURSION ("Database error querying schema")
-- ============================================================
-- Run this in your Supabase SQL Editor. This will fix the 
-- recursive get_user_role() function which is crashing logins.

-- 1. DROP THE RECURSIVE FUNCTION
DROP FUNCTION IF EXISTS public.get_user_role() CASCADE;

-- 2. RE-CREATE THE SAFE, NON-RECURSIVE ROLE HELPER
-- This reads the role from the token's JWT memory OR from auth.users directly.
-- It NEVER queries public.profiles, preventing RLS infinite loops.
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
DECLARE
  u_role text;
BEGIN
  -- A. Read directly from JWT in-memory claims (fastest)
  u_role := auth.jwt() -> 'user_metadata' ->> 'role';
  IF u_role IS NOT NULL THEN
    RETURN u_role;
  END IF;

  -- B. Fallback to auth.users table (bypasses public.profiles RLS checks)
  SELECT COALESCE(raw_user_meta_data ->> 'role', 'candidate') INTO u_role
  FROM auth.users
  WHERE id = auth.uid() LIMIT 1;

  RETURN COALESCE(u_role, 'candidate');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. REPAIR METADATA FOR ADMINS (Ensure they are marked as 'admin' in auth.users)
-- This is critical so get_user_role() knows they are admins.
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role":"admin","full_name":"Super Admin"}'::jsonb
WHERE email = 'info@isuccessnode.com';

UPDATE public.profiles 
SET role = 'admin', full_name = 'Super Admin', profile_completed = true 
WHERE email = 'info@isuccessnode.com';

UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role":"admin","full_name":"Staff Admin"}'::jsonb
WHERE email = 'staffadmin@gmail.com';

UPDATE public.profiles 
SET role = 'admin', full_name = 'Staff Admin', profile_completed = true 
WHERE email = 'staffadmin@gmail.com';

-- 4. RE-ESTABLISH POLICIES FRESH & CLEAN
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile insert" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete all profiles" ON public.profiles;

-- RLS Rules using the safe function
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT USING (public.get_user_role() = 'admin');

CREATE POLICY "Allow profile insert"
  ON public.profiles FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE USING (public.get_user_role() = 'admin');

CREATE POLICY "Admins can delete all profiles"
  ON public.profiles FOR DELETE USING (public.get_user_role() = 'admin');

-- 5. RELOAD SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
