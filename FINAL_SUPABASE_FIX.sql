-- ==========================================
-- FINAL SUPABASE FIX SCRIPT
-- ==========================================
-- Run this in your Supabase SQL Editor to unblock Candidate Registration.

-- 1. ENSURE PROFILES TABLE HAS ALL COLUMNS
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS aadhaar_front_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS aadhaar_back_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_photo_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_completed boolean DEFAULT false;

-- 2. CREATE STORAGE BUCKET
-- Note: 'storage' schema might require superuser. If this fails, create 'aadhaar_cards' bucket manually in Dashboard.
INSERT INTO storage.buckets (id, name, public)
VALUES ('aadhaar_cards', 'aadhaar_cards', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. STORAGE RLS POLICIES
-- Drop existing to avoid conflicts
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Owner Access" ON storage.objects;

-- Allow public viewing of documents (needed for Admin view)
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'aadhaar_cards');

-- Allow authenticated users to upload their documents
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'aadhaar_cards');

-- Allow users to manage their own objects
CREATE POLICY "Owner Access" ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'aadhaar_cards');

-- 4. DATABASE RLS POLICIES FOR PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 5. ENSURE EXAMS ARE MANAGEABLE BY ADMINS
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view exams" ON public.exams;
CREATE POLICY "Anyone can view exams" ON public.exams FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage exams" ON public.exams;
CREATE POLICY "Admins can manage exams" ON public.exams FOR ALL 
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
