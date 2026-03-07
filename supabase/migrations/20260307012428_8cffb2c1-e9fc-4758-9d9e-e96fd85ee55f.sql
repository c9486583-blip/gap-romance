UPDATE storage.buckets 
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp']
WHERE id = 'profile-photos';