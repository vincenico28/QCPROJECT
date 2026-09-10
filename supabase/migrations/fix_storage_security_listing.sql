-- ==============================================================================
-- RESOLVE SUPABASE SECURITY WARNING: "Public Bucket Allows Listing"
-- Public buckets serve files directly via the public CDN without evaluating SELECT policies.
-- Dropping SELECT policies on storage.objects disables directory listing/scraping 
-- while keeping all image URLs 100% accessible to citizens and officers.
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/wcprajgotifqgwdjnpss/sql/new
-- ==============================================================================

-- Drop all SELECT policies on storage.objects for the evidence bucket
DROP POLICY IF EXISTS "evidence_authenticated_select" ON storage.objects;
DROP POLICY IF EXISTS "evidence_public_select" ON storage.objects;
DROP POLICY IF EXISTS "Public Evidence Access" ON storage.objects;
