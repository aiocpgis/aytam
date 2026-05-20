-- ==========================================
-- Fix RLS Policies for Public Applications
-- ==========================================

-- 1. Enable RLS on orphan_applications (if not already enabled)
ALTER TABLE public.orphan_applications ENABLE ROW LEVEL SECURITY;

-- 2. Allow public (anon) and authenticated users to submit new applications
DROP POLICY IF EXISTS "Enable public insert for orphan_applications" ON public.orphan_applications;
CREATE POLICY "Enable public insert for orphan_applications" ON public.orphan_applications
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- 3. Allow admins (with orphans.view) to read the applications
DROP POLICY IF EXISTS "Admin select orphan_applications" ON public.orphan_applications;
CREATE POLICY "Admin select orphan_applications" ON public.orphan_applications
  FOR SELECT TO authenticated
  USING (public.has_permission('orphans.view'));

-- 4. Allow admins to update applications
DROP POLICY IF EXISTS "Admin update orphan_applications" ON public.orphan_applications;
CREATE POLICY "Admin update orphan_applications" ON public.orphan_applications
  FOR UPDATE TO authenticated
  USING (public.has_permission('orphans.update'));

-- 5. Allow admins to delete applications
DROP POLICY IF EXISTS "Admin delete orphan_applications" ON public.orphan_applications;
CREATE POLICY "Admin delete orphan_applications" ON public.orphan_applications
  FOR DELETE TO authenticated
  USING (public.has_permission('orphans.delete'));

-- ==========================================
-- Fix Storage Policies for Uploaded Documents
-- ==========================================

-- 1. Allow public (anon) and authenticated users to upload documents 
-- (Restricted to the 'public-applications' folder)
DROP POLICY IF EXISTS "Public upload to orphan-documents" ON storage.objects;
CREATE POLICY "Public upload to orphan-documents" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    bucket_id = 'orphan-documents' 
    AND (storage.foldername(name))[1] = 'public-applications'
  );

-- 2. Allow admins to view documents
DROP POLICY IF EXISTS "Admin select documents" ON storage.objects;
CREATE POLICY "Admin select documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'orphan-documents' 
    AND public.has_permission('orphans.view_documents')
  );

-- 3. Allow admins to update documents
DROP POLICY IF EXISTS "Admin update documents" ON storage.objects;
CREATE POLICY "Admin update documents" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'orphan-documents' 
    AND public.has_permission('orphans.view_documents')
  );

-- 4. Allow admins to delete documents
DROP POLICY IF EXISTS "Admin delete documents" ON storage.objects;
CREATE POLICY "Admin delete documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'orphan-documents' 
    AND public.has_permission('orphans.view_documents')
  );
