/*
  # Create storage bucket and policies for receipts

  1. Storage Setup
    - Create receipts bucket
    - Enable public access for receipt images
  
  2. Security
    - Enable storage policies for authenticated users
    - Allow public read access
*/

-- Create receipts bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload receipts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'receipts' AND
  auth.role() = 'authenticated'
);

-- Allow authenticated users to update their own files
CREATE POLICY "Allow users to update their own receipts"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'receipts' AND
  owner = auth.uid()
)
WITH CHECK (
  bucket_id = 'receipts' AND
  owner = auth.uid()
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Allow users to delete their own receipts"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'receipts' AND
  owner = auth.uid()
);

-- Allow public read access to receipt images
CREATE POLICY "Allow public read access to receipts"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'receipts');