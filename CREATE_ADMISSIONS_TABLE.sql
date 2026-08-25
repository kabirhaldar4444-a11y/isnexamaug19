-- Create admissions table
CREATE TABLE IF NOT EXISTS public.admissions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    course_name text,
    pincode text,
    state text,
    city text,
    address text,
    aadhaar_front_url text,
    aadhaar_back_url text,
    pan_url text,
    signature_url text,
    profile_photo_url text,
    ip_address text,
    status text DEFAULT 'pending',
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure profiles has the extra columns just in case
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pan_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signature_url text;

-- Enable RLS
ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert admission records
DROP POLICY IF EXISTS "Allow anonymous to submit admissions" ON public.admissions;
CREATE POLICY "Allow anonymous to submit admissions" 
ON public.admissions FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Allow authenticated admins to select and update
DROP POLICY IF EXISTS "Allow admins to read admissions" ON public.admissions;
CREATE POLICY "Allow admins to read admissions" 
ON public.admissions FOR SELECT 
TO authenticated 
USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );

DROP POLICY IF EXISTS "Allow admins to update admissions" ON public.admissions;
CREATE POLICY "Allow admins to update admissions" 
ON public.admissions FOR UPDATE 
TO authenticated 
USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );

-- Create RPC to accept admission and create user
CREATE OR REPLACE FUNCTION public.admin_accept_admission(
  p_admission_id     uuid,
  p_password         text
) RETURNS uuid AS $$
DECLARE
  v_admission record;
  new_user_id uuid;
  normalized_email text;
BEGIN
  -- Verify admin
  IF (SELECT role FROM public.profiles WHERE id = auth.uid()) != 'admin' THEN
    RAISE EXCEPTION 'Access Denied: Only administrators can accept admissions';
  END IF;

  -- Get admission record
  SELECT * INTO v_admission FROM public.admissions WHERE id = p_admission_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Admission record not found';
  END IF;

  IF v_admission.status = 'accepted' THEN
    RAISE EXCEPTION 'Admission is already accepted';
  END IF;

  normalized_email := LOWER(TRIM(v_admission.email));

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = normalized_email) THEN
    RAISE EXCEPTION 'A user with this email already exists: %', normalized_email;
  END IF;

  new_user_id := gen_random_uuid();

  -- 1. Create auth user
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, is_super_admin,
    confirmation_token, recovery_token, email_change_token_new,
    email_change, phone_change, phone_change_token,
    reauthentication_token, email_change_token_current
  ) VALUES (
    new_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    normalized_email,
    crypt(p_password, gen_salt('bf', 10)),
    now(),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    jsonb_build_object('role', 'candidate', 'full_name', v_admission.full_name),
    now(), now(), false,
    '', '', '',
    '', '', '',
    '', ''
  );

  -- 2. Create auth identity
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), new_user_id,
    jsonb_build_object('sub', new_user_id::text, 'email', normalized_email),
    'email', normalized_email,
    now(), now(), now()
  );

  -- 3. Create profile with all details mapped
  INSERT INTO public.profiles (
    id, email, full_name, phone, address, 
    aadhaar_front_url, aadhaar_back_url, pan_url, signature_url, profile_photo_url, 
    ip_address, profile_completed, role
  ) VALUES (
    new_user_id, normalized_email, v_admission.full_name, v_admission.phone,
    v_admission.address || ', ' || v_admission.city || ', ' || v_admission.state || ' - ' || v_admission.pincode,
    v_admission.aadhaar_front_url, v_admission.aadhaar_back_url, v_admission.pan_url, v_admission.signature_url, v_admission.profile_photo_url,
    v_admission.ip_address, true, 'candidate'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email, 
    full_name = EXCLUDED.full_name, 
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    aadhaar_front_url = EXCLUDED.aadhaar_front_url,
    aadhaar_back_url = EXCLUDED.aadhaar_back_url,
    pan_url = EXCLUDED.pan_url,
    signature_url = EXCLUDED.signature_url,
    profile_photo_url = EXCLUDED.profile_photo_url,
    ip_address = EXCLUDED.ip_address,
    profile_completed = EXCLUDED.profile_completed,
    role = 'candidate';

  -- 4. Update admission status
  UPDATE public.admissions SET status = 'accepted' WHERE id = p_admission_id;

  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
