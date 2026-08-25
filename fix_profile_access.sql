-- ============================================================
-- FINAL RLS POLICY FIX FOR PROFILES (SCHEMA ERROR FIX)
-- ============================================================
-- 1. Drops old conflicting policies
-- 2. Sets up SELECT, INSERT, and UPDATE for profiles
-- 3. Corrects "Database error querying schema" by ensuring RLS access

-- First, ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Remove duplicate or old policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile insert" ON public.profiles;

-- 1. SELECT: Users can view THEIR OWN profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- 2. SELECT: Admins can view ALL profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.get_user_role() = 'admin');

-- 3. INSERT: Allow profile creation (Necessary for RPC)
CREATE POLICY "Allow profile insert"
ON public.profiles
FOR INSERT
WITH CHECK (true);

-- 4. UPDATE: Users can update THEIR OWN profile
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- 5. UPDATE: Admins can update ALL profiles
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (public.get_user_role() = 'admin');

-- 6. DELETE: Admins can delete ALL profiles (Necessary for RPC)
CREATE POLICY "Admins can delete all profiles"
ON public.profiles
FOR DELETE
USING (public.get_user_role() = 'admin');
