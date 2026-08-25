-- ============================================================
-- FIX: AUTOMATIC PROFILE CREATION TRIGGER
-- ============================================================
-- This script ensures that EVERY user created in Supabase (via Admin or Sign Up)
-- automatically gets a matching record in the 'public.profiles' table.
-- This prevents the "Account initialization incomplete" error during login.

-- 1. Create the function that will handle the auto-insertion
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'System User'),
    COALESCE(new.raw_user_meta_data->>'role', 'candidate')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger on the auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. REPAIR: Fix any current users who are missing a profile
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

-- 4. Verify RLS (Ensures users can actually read their own newly created profile)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
CREATE POLICY "Anyone can view profiles" 
ON public.profiles FOR SELECT 
USING (true);

RAISE NOTICE 'Profile Trigger and Repair successfully applied.';
