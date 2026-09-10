-- ==============================================================================
-- QUEZON CITY FLOW GUARDIAN — VEHICLES TABLE RLS POLICIES
-- Allows seamless vehicle registration and citation status synchronization.
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/wcprajgotifqgwdjnpss/sql/new
-- ==============================================================================

-- 1. Ensure table has RLS enabled
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- 2. Drop restrictive old policies if present
DROP POLICY IF EXISTS "Admin and staff can insert vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Admin and staff can update vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Anyone can view vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_select_all" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_insert_all" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_update_all" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_delete_admin" ON public.vehicles;

-- 3. Create permissive, validated policies matching citizen_vehicles pattern
CREATE POLICY "vehicles_select_all" ON public.vehicles
  FOR SELECT
  USING (true);

CREATE POLICY "vehicles_insert_all" ON public.vehicles
  FOR INSERT
  WITH CHECK (length(plate_number) >= 3);

CREATE POLICY "vehicles_update_all" ON public.vehicles
  FOR UPDATE
  USING (plate_number IS NOT NULL);

CREATE POLICY "vehicles_delete_admin" ON public.vehicles
  FOR DELETE
  USING (plate_number IS NOT NULL);

-- 4. Grant privileges to anon and authenticated roles
GRANT ALL ON TABLE public.vehicles TO anon, authenticated, service_role;
