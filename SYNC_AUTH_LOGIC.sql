-- ==========================================
-- STEP 1: NATIVE AUTO-SYNC AUTH LOGIC
-- ==========================================
-- This script shifts user creation from manual SQL "hacks" 
-- to a profile-first system that uses Supabase's Official API.

-- 1. Enable RLS on Profiles (if not already)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Add 'can_register' flag to control auto-signup
-- This ensures only ADMIN-CREATED emails can register.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS can_register boolean DEFAULT true;

-- 3. Simplified Admin RPC: CREATE PROFILE ONLY
-- No more touching auth.users or auth.identities from SQL.
DROP FUNCTION IF EXISTS public.admin_create_candidate(text, text, text);
DROP FUNCTION IF EXISTS public.admin_create_candidate_profile(text, text);

CREATE OR REPLACE FUNCTION public.admin_create_candidate_profile(
  candidate_email text,
  candidate_name text
) RETURNS void AS $$
BEGIN
  -- Authorization Check (Only Admin can add profiles)
  IF public.get_user_role() != 'admin' THEN RAISE EXCEPTION 'Access Denied'; END IF;

  INSERT INTO public.profiles (email, full_name, role, can_register)
  VALUES (LOWER(TRIM(candidate_email)), candidate_name, 'candidate', true)
  ON CONFLICT (email) DO UPDATE 
  SET full_name = EXCLUDED.full_name, role = 'candidate', can_register = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RLS Policy: Allow 'anon' to check if an email is authorized
-- This is critical for the "Auto-Sync" login flow.
-- It ONLY returns true/false, no private data exposed.
CREATE OR REPLACE FUNCTION public.is_authorized_email(check_email text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE email = LOWER(TRIM(check_email)) 
    AND can_register = true
    AND id IS NULL -- User hasn't registered in 'auth' yet
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Final Permission Check: Ensure anon can call the helper
GRANT EXECUTE ON FUNCTION public.is_authorized_email(text) TO anon, authenticated;
