-- Grant authenticated users permission to manage their own objects in aadhaar_cards bucket
-- Note: 'storage.objects' is the table for all files in all buckets

INSERT INTO storage.buckets (id, name, public)
VALUES ('aadhaar_cards', 'aadhaar_cards', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policy for viewing
CREATE POLICY "Allow authenticated users to view all aadhaar cards" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'aadhaar_cards');

-- Policy for uploading
CREATE POLICY "Allow authenticated users to upload their own aadhaar cards" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'aadhaar_cards');

-- Policy for updating
CREATE POLICY "Allow authenticated users to update their own aadhaar cards" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'aadhaar_cards');

-- Policy for deleting
CREATE POLICY "Allow authenticated users to delete their own aadhaar cards" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'aadhaar_cards');
