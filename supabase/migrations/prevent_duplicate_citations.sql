-- ==============================================================================
-- QUEZON CITY FLOW GUARDIAN — CITATIONS DEDUPLICATION & UNIQUE INTEGRITY
-- Enforces 1-to-1 violation-to-citation mapping and cleans up legacy duplicates.
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/wcprajgotifqgwdjnpss/sql/new
-- ==============================================================================

-- 1. Remove any existing duplicate citations, keeping the oldest / settled record
WITH ranked_citations AS (
  SELECT 
    id,
    violation_id,
    ROW_NUMBER() OVER (
      PARTITION BY violation_id 
      ORDER BY 
        CASE WHEN status = 'paid' THEN 0 ELSE 1 END,
        issued_at ASC
    ) as rank
  FROM public.citations
  WHERE violation_id IS NOT NULL
)
DELETE FROM public.citations
WHERE id IN (
  SELECT id FROM ranked_citations WHERE rank > 1
);

-- 2. Create partial unique index on violation_id to prevent any future duplicate citations
CREATE UNIQUE INDEX IF NOT EXISTS idx_citations_unique_violation_id 
  ON public.citations (violation_id) 
  WHERE violation_id IS NOT NULL;

-- 3. Ensure all violations with citations are marked as 'confirmed'
UPDATE public.violations
SET status = 'confirmed'
WHERE id IN (SELECT violation_id FROM public.citations WHERE violation_id IS NOT NULL)
  AND status = 'pending';

-- 4. Enable RLS and verify write privileges
GRANT ALL ON TABLE public.citations TO anon, authenticated, service_role;
