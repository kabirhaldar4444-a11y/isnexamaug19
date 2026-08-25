-- Allow anonymous (unauthenticated) users to upload documents to the aadhaar_cards bucket
-- This is necessary for the public Admission form to work without requiring login

-- Create policy to allow anonymous uploads
CREATE POLICY "Allow anonymous users to upload admission documents" 
ON storage.objects FOR INSERT 
TO anon
WITH CHECK (bucket_id = 'aadhaar_cards');

-- Also allow anonymous users to view/select so that we can retrieve public URLs if necessary
CREATE POLICY "Allow anonymous users to view admission documents" 
ON storage.objects FOR SELECT 
TO anon 
USING (bucket_id = 'aadhaar_cards');
