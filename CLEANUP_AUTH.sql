-- ============================================================
--  CLEANUP SQL — Run this to fix "Database error checking email"
-- ============================================================
--  Previous failed SQL runs left broken/partial auth records.
--  This removes them completely so Dashboard user creation works.
-- ============================================================

-- Step 1: Remove any broken identities for these emails
DELETE FROM auth.identities
WHERE provider_id IN ('info@isuccessnode.com', 'staffadmin@gmail.com');

-- Step 2: Remove any partial/broken profiles for these emails
DELETE FROM public.profiles
WHERE email IN ('info@isuccessnode.com', 'staffadmin@gmail.com');

-- Step 3: Remove any partial auth users for these emails
DELETE FROM auth.users
WHERE email IN ('info@isuccessnode.com', 'staffadmin@gmail.com');

-- Step 4: Check if any hooks are configured (that might be causing issues)
-- Also check auth.hooks table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'hooks') THEN
    RAISE NOTICE 'auth.hooks table exists - check for any configured hooks';
  ELSE
    RAISE NOTICE 'No auth.hooks table - hooks not the issue';
  END IF;
END $$;

-- ============================================================
-- ✅ After this runs successfully:
-- Go to Authentication → Users → Add user → Create new user
--   info@isuccessnode.com  / qwerty@123  (check Auto confirm)
--   staffadmin@gmail.com   / ABC123      (check Auto confirm)
-- ============================================================
