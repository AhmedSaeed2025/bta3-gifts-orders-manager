
-- Create storage bucket for order attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('order-attachments', 'order-attachments', true);

-- Create policy to allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload order attachments" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'order-attachments');

-- Create policy to allow public access to view order attachments
CREATE POLICY "Allow public access to order attachments" 
ON storage.objects 
FOR SELECT 
TO public 
USING (bucket_id = 'order-attachments');
