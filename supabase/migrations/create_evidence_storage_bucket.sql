-- ==============================================================================
-- QUEZON CITY FLOW GUARDIAN — SUPABASE STORAGE & CITATION EVIDENCE
-- 1. Creates the public 'evidence' bucket in storage.buckets
-- 2. Sets permissive storage policies for evidence photo uploads & public inspection
-- 3. Adds evidence_url column to public.citations
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/wcprajgotifqgwdjnpss/sql/new
-- ==============================================================================

-- 1. Ensure citations table has evidence_url column
ALTER TABLE public.citations 
  ADD COLUMN IF NOT EXISTS evidence_url TEXT;

-- 2. Create the 'evidence' public storage bucket if not already exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'evidence', 
  'evidence', 
  true, 
  15728640, -- 15MB file size limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 15728640,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

-- 3. Note: RLS is already enabled on storage.objects by Supabase by default.
-- (Do NOT run ALTER TABLE storage.objects as it is owned by supabase_storage_admin)

-- 4. Clean up any existing storage policies for the evidence bucket
DROP POLICY IF EXISTS "Public Evidence Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Evidence Upload" ON storage.objects;
DROP POLICY IF EXISTS "Public Evidence Update" ON storage.objects;
DROP POLICY IF EXISTS "Public Evidence Delete" ON storage.objects;
DROP POLICY IF EXISTS "evidence_public_select" ON storage.objects;
DROP POLICY IF EXISTS "evidence_public_insert" ON storage.objects;
-- 5. Note: Public buckets serve files directly via the CDN (/storage/v1/object/public/...) 
-- without needing a SELECT policy on storage.objects. Omitting SELECT prevents directory listing.

CREATE POLICY "evidence_public_insert" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'evidence');

CREATE POLICY "evidence_public_update" ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'evidence');

CREATE POLICY "evidence_public_delete" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'evidence');

-- 6. Backfill existing citations that have linked violations with their evidence_url
UPDATE public.citations c
SET evidence_url = v.evidence_url
FROM public.violations v
WHERE c.violation_id = v.id
  AND (c.evidence_url IS NULL OR c.evidence_url = '')
  AND v.evidence_url IS NOT NULL;
