-- Bucket público para logos y banners de restaurantes
INSERT INTO storage.buckets (id, name, public)
VALUES ('restaurant-logos', 'restaurant-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Admins del tenant pueden subir imágenes a su propia carpeta (slug/)
CREATE POLICY "Tenant admins can upload restaurant images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'restaurant-logos'
  AND (storage.foldername(name))[1] IN (
    SELECT t.slug FROM tenants t
    INNER JOIN tenant_users tu ON tu.tenant_id = t.id
    WHERE tu.user_id = auth.uid()
  )
);

-- Admins pueden sobreescribir (upsert: true en el cliente)
CREATE POLICY "Tenant admins can update restaurant images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'restaurant-logos'
  AND (storage.foldername(name))[1] IN (
    SELECT t.slug FROM tenants t
    INNER JOIN tenant_users tu ON tu.tenant_id = t.id
    WHERE tu.user_id = auth.uid()
  )
);

-- Cualquiera puede ver las imágenes (menú público)
CREATE POLICY "Public read restaurant images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'restaurant-logos');
