INSERT INTO storage.buckets (id, name, public)
VALUES ('client-photos', 'client-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Authenticated upload client photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'client-photos');

CREATE POLICY "Authenticated update client photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'client-photos');

CREATE POLICY "Public read client photos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'client-photos');
