-- Restrict csos base table to staff only; public reads must go via csos_public view
DROP POLICY IF EXISTS "CSOs base record readable by all" ON public.csos;

CREATE POLICY "Staff read full csos"
ON public.csos
FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

-- Ensure csos_public view is publicly readable (it already excludes contact_email)
GRANT SELECT ON public.csos_public TO anon, authenticated;

-- Restrict cso-documents storage uploads: must be a real submission
-- Drop existing permissive policies for inserts on cso-documents bucket
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND cmd = 'INSERT'
      AND qual ILIKE '%cso-documents%' OR with_check ILIKE '%cso-documents%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- New restricted INSERT: file path must start with a request_id of a recent (last 24h) pending verification request
CREATE POLICY "Uploads tied to recent CSO verification requests"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'cso-documents'
  AND EXISTS (
    SELECT 1 FROM public.cso_verification_requests r
    WHERE (storage.foldername(name))[1] = r.id::text
      AND r.created_at > now() - interval '24 hours'
  )
);

-- Staff can manage all cso-documents storage objects
CREATE POLICY "Staff manage cso-documents storage"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'cso-documents' AND public.is_staff(auth.uid()))
WITH CHECK (bucket_id = 'cso-documents' AND public.is_staff(auth.uid()));