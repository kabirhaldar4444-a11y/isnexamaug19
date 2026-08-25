-- ============================================================
--  PART 2 — Run this AFTER creating users via Dashboard
-- ============================================================
--  Run this only after both admin users are created in:
--  Authentication → Users → Add user → Create new user
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Add any missing columns ──────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email               text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone               text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address             text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS aadhaar_front_url   text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS aadhaar_back_url    text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_photo_url   text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_completed   boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_exam_locked      boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS allotted_exam_ids   uuid[]  DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ip_address          text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS can_register        boolean DEFAULT true;

-- ── Other tables ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.exams (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  title      text        NOT NULL,
  duration   integer     NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.questions (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id        uuid        REFERENCES public.exams ON DELETE CASCADE NOT NULL,
  question_text  text        NOT NULL,
  options        jsonb       NOT NULL,
  correct_option integer     NOT NULL,
  explanation    text,
  created_at     timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS explanation text;

CREATE TABLE IF NOT EXISTS public.submissions (
  id                   uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id              uuid        REFERENCES auth.users NOT NULL,
  exam_id              uuid        REFERENCES public.exams NOT NULL,
  score                integer     NOT NULL,
  total_questions      integer     NOT NULL,
  answers              jsonb       NOT NULL,
  is_released          boolean     DEFAULT false,
  admin_score_override integer,
  created_at           timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS is_released          boolean DEFAULT false;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS admin_score_override  integer;

-- ── Enable RLS ───────────────────────────────────────────────
ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- ── Drop old policies ────────────────────────────────────────
DO $$
BEGIN
  DROP POLICY IF EXISTS "Public profiles are viewable by everyone"  ON public.profiles;
  DROP POLICY IF EXISTS "Anyone can view profiles"                  ON public.profiles;
  DROP POLICY IF EXISTS "Users can view their own profile"          ON public.profiles;
  DROP POLICY IF EXISTS "Admins can view all profiles"              ON public.profiles;
  DROP POLICY IF EXISTS "Allow profile insert"                      ON public.profiles;
  DROP POLICY IF EXISTS "Users can update their own profile"        ON public.profiles;
  DROP POLICY IF EXISTS "Users can update own profile"              ON public.profiles;
  DROP POLICY IF EXISTS "Admins can update all profiles"            ON public.profiles;
  DROP POLICY IF EXISTS "Admins can manage profiles"                ON public.profiles;
  DROP POLICY IF EXISTS "Admins can delete all profiles"            ON public.profiles;
  DROP POLICY IF EXISTS "Anyone can view exams"                     ON public.exams;
  DROP POLICY IF EXISTS "Admins can manage exams"                   ON public.exams;
  DROP POLICY IF EXISTS "Anyone can view questions"                 ON public.questions;
  DROP POLICY IF EXISTS "Admins can manage questions"               ON public.questions;
  DROP POLICY IF EXISTS "Users can insert their own submissions"    ON public.submissions;
  DROP POLICY IF EXISTS "Users can view their own submissions"      ON public.submissions;
  DROP POLICY IF EXISTS "Admins can manage submissions"             ON public.submissions;
  DROP POLICY IF EXISTS "Public Access"                             ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated Upload"                      ON storage.objects;
  DROP POLICY IF EXISTS "Owner Access"                              ON storage.objects;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ── Helper function ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
DECLARE
  u_role text;
BEGIN
  SELECT role INTO u_role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
  RETURN u_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── RLS Policies ─────────────────────────────────────────────
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

CREATE POLICY "Anyone can view exams"
  ON public.exams FOR SELECT USING (true);
CREATE POLICY "Admins can manage exams"
  ON public.exams FOR ALL USING (public.get_user_role() = 'admin');

CREATE POLICY "Anyone can view questions"
  ON public.questions FOR SELECT USING (true);
CREATE POLICY "Admins can manage questions"
  ON public.questions FOR ALL USING (public.get_user_role() = 'admin');

CREATE POLICY "Users can insert their own submissions"
  ON public.submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own submissions"
  ON public.submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage submissions"
  ON public.submissions FOR ALL USING (public.get_user_role() = 'admin');

-- ── RPCs ─────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.admin_create_candidate(text, text, text) CASCADE;
CREATE OR REPLACE FUNCTION public.admin_create_candidate(
  candidate_email    text,
  candidate_password text,
  candidate_name     text
) RETURNS uuid AS $$
DECLARE
  new_user_id      uuid;
  normalized_email text;
BEGIN
  IF public.get_user_role() != 'admin' THEN
    RAISE EXCEPTION 'Access Denied: Only administrators can create candidates';
  END IF;
  normalized_email := LOWER(TRIM(candidate_email));
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = normalized_email) THEN
    RAISE EXCEPTION 'User already exists: %', normalized_email;
  END IF;
  new_user_id := gen_random_uuid();
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at, is_super_admin
  ) VALUES (
    new_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', normalized_email,
    crypt(candidate_password, gen_salt('bf', 10)), now(),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    jsonb_build_object('role', 'candidate', 'full_name', candidate_name),
    now(), now(), false
  );
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), new_user_id,
    jsonb_build_object('sub', new_user_id::text, 'email', normalized_email),
    'email', normalized_email, now(), now(), now()
  );
  INSERT INTO public.profiles (id, email, full_name, role, profile_completed)
  VALUES (new_user_id, normalized_email, candidate_name, 'candidate', false)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email, full_name = EXCLUDED.full_name, role = 'candidate';
  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.admin_update_candidate(uuid, text, text, text, uuid[]) CASCADE;
CREATE OR REPLACE FUNCTION public.admin_update_candidate(
  target_user_id        uuid,
  new_email             text,
  new_password          text   DEFAULT NULL,
  new_name              text   DEFAULT NULL,
  new_allotted_exam_ids uuid[] DEFAULT NULL
) RETURNS void AS $$
BEGIN
  IF public.get_user_role() != 'admin' THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE auth.users SET email = new_email, updated_at = now() WHERE id = target_user_id;
  UPDATE auth.identities SET
    identity_data = jsonb_build_object('sub', target_user_id::text, 'email', new_email),
    provider_id = new_email, updated_at = now()
  WHERE user_id = target_user_id AND provider = 'email';
  IF new_password IS NOT NULL AND TRIM(new_password) != '' THEN
    UPDATE auth.users SET
      encrypted_password = crypt(new_password, gen_salt('bf', 10)), updated_at = now()
    WHERE id = target_user_id;
  END IF;
  UPDATE public.profiles SET
    email = new_email,
    full_name = COALESCE(new_name, full_name),
    allotted_exam_ids = COALESCE(new_allotted_exam_ids, allotted_exam_ids)
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.admin_delete_user(uuid) CASCADE;
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id uuid)
RETURNS json AS $$
DECLARE
  caller_role   text;
  target_exists boolean;
BEGIN
  caller_role := public.get_user_role();
  IF caller_role != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can delete users';
  END IF;
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Safety: Cannot delete your own account';
  END IF;
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = target_user_id) INTO target_exists;
  IF NOT target_exists THEN
    RETURN json_build_object('success', false, 'message', 'User not found');
  END IF;
  DELETE FROM public.submissions WHERE user_id = target_user_id;
  DELETE FROM public.profiles    WHERE id      = target_user_id;
  DELETE FROM auth.identities    WHERE user_id = target_user_id;
  DELETE FROM auth.users         WHERE id      = target_user_id;
  RETURN json_build_object('success', true, 'message', 'User deleted successfully');
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Deletion failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Storage ──────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('aadhaar_cards', 'aadhaar_cards', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Public Access"
  ON storage.objects FOR SELECT USING (bucket_id = 'aadhaar_cards');
CREATE POLICY "Authenticated Upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'aadhaar_cards');
CREATE POLICY "Owner Access"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'aadhaar_cards');

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_id_role ON public.profiles (id, role);
CREATE INDEX IF NOT EXISTS idx_profiles_email    ON public.profiles (email);
CREATE INDEX IF NOT EXISTS idx_submissions_user  ON public.submissions (user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_exam  ON public.submissions (exam_id);
CREATE INDEX IF NOT EXISTS idx_questions_exam    ON public.questions (exam_id);

-- ── Repair: ensure all users have a profile ──────────────────
INSERT INTO public.profiles (id, email, full_name, role, profile_completed)
SELECT id, email,
  COALESCE(raw_user_meta_data->>'full_name', 'User'),
  'candidate', false
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- ── Set Admin roles ──────────────────────────────────────────
UPDATE public.profiles
SET role = 'admin', full_name = 'Super Admin', profile_completed = true
WHERE email = 'info@isuccessnode.com';

UPDATE public.profiles
SET role = 'admin', full_name = 'Staff Admin', profile_completed = true
WHERE email = 'staffadmin@gmail.com';

-- ── Reload schema cache ──────────────────────────────────────
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- ✅ ALL DONE! Login should work now.
-- ============================================================
