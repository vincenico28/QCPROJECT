-- ==============================================================================
-- QUEZON CITY FLOW GUARDIAN — MASTER DATABASE PERMISSIONS & RLS FIX
-- Run this SQL in your Supabase SQL Editor (https://supabase.com/dashboard/project/ooqqgnphtanvgrhvygnu/sql/new)
-- ==============================================================================

-- 1. Grant table access to anon, authenticated, and service_role
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- 2. Drop existing restrictive policies
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, p.tablename);
  END LOOP;
END $$;

-- 3. Enable RLS on all tables
ALTER TABLE public.cameras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- 4. Create permissive policies for full-stack functionality
CREATE POLICY "Allow all on cameras" ON public.cameras FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on violations" ON public.violations FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on citations" ON public.citations FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on officers" ON public.officers FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on dispatches" ON public.dispatches FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on disputes" ON public.disputes FOR ALL TO public USING (true) WITH CHECK (true);

-- 5. Seed default cameras if empty
INSERT INTO public.cameras (code, location, status, lat, lng)
SELECT 'QC-CAM-1001', 'Commonwealth Ave cor. Tandang Sora', 'online', 14.6563, 121.0697
WHERE NOT EXISTS (SELECT 1 FROM public.cameras WHERE code = 'QC-CAM-1001');

INSERT INTO public.cameras (code, location, status, lat, lng)
SELECT 'QC-CAM-1002', 'Commonwealth Ave (Luzon Overpass Eastbound)', 'online', 14.6723, 121.0507
WHERE NOT EXISTS (SELECT 1 FROM public.cameras WHERE code = 'QC-CAM-1002');

INSERT INTO public.cameras (code, location, status, lat, lng)
SELECT 'QC-CAM-1003', 'Visayas Ave near Central Market', 'online', 14.6623, 121.0423
WHERE NOT EXISTS (SELECT 1 FROM public.cameras WHERE code = 'QC-CAM-1003');

-- 6. Seed default officers if empty
INSERT INTO public.officers (badge_number, full_name, rank, unit, district, contact_number, status, on_duty, citations_issued)
SELECT '7742', 'Ramon Rodriguez', 'Senior Enforcer III', 'Traffic Enforcement Unit', 'District I', '+63 917 442 1180', 'active', true, 184
WHERE NOT EXISTS (SELECT 1 FROM public.officers WHERE badge_number = '7742');

INSERT INTO public.officers (badge_number, full_name, rank, unit, district, contact_number, status, on_duty, citations_issued)
SELECT '6318', 'Maria Cristina Bautista', 'Enforcer II', 'Highway Patrol', 'District II', '+63 918 330 9821', 'active', true, 142
WHERE NOT EXISTS (SELECT 1 FROM public.officers WHERE badge_number = '6318');
