-- ==============================================================================
-- QUEZON CITY FLOW GUARDIAN — CITIZEN PORTAL & COMMAND CENTER MASTER TABLES
-- Creates tables for:
-- 1. `citizen_profiles`: Motorist citizen accounts, contact info & eco-tokens
-- 2. `citizen_vehicles`: Citizen verified motor fleet with LTO hold status
-- 3. `citizen_vouchers`: Claimed eco-reward vouchers
-- 4. `driver_nominations`: Statutory TAB driver nomination affidavits
-- 5. `officers`: Field enforcement officers and active duty roster
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/ooqqgnphtanvgrhvygnu/sql/new
-- ==============================================================================

-- -------------------------------------------------------------
-- 1. CITIZEN PROFILES TABLE (`/citizen`)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.citizen_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  address TEXT NOT NULL DEFAULT 'Brgy. Culiat, Quezon City',
  driver_license_number TEXT,
  tokens INTEGER NOT NULL DEFAULT 150,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------
-- 2. CITIZEN VEHICLES TABLE (`/citizen`, `/vehicles`)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.citizen_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id UUID REFERENCES public.citizen_profiles(id) ON DELETE CASCADE,
  plate_number TEXT NOT NULL,
  make_model TEXT NOT NULL,
  vehicle_type TEXT NOT NULL DEFAULT 'Sedan',
  status TEXT NOT NULL DEFAULT 'verified', -- 'verified', 'pending'
  lto_expiry TEXT DEFAULT '2027-12-31',
  lto_alarm_status TEXT NOT NULL DEFAULT 'CLEARED', -- 'CLEARED', 'WARNING_DUE_SOON', 'LTO_ALARM_ACTIVE'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------
-- 3. CITIZEN VOUCHERS TABLE (`/citizen`)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.citizen_vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id UUID REFERENCES public.citizen_profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cost INTEGER NOT NULL DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'used'
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------
-- 4. DRIVER NOMINATIONS TABLE (`/citizen`, `/disputes`)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.driver_nominations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citation_id TEXT NOT NULL,
  citizen_id UUID REFERENCES public.citizen_profiles(id) ON DELETE SET NULL,
  nominee_name TEXT NOT NULL,
  nominee_license TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted', -- 'submitted', 'verified', 'rejected'
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------
-- 5. FIELD OFFICERS TABLE (`/officers`, `/dashboard`)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.officers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  badge_number TEXT NOT NULL UNIQUE,
  rank TEXT NOT NULL DEFAULT 'Traffic Enforcer I',
  unit TEXT NOT NULL DEFAULT 'Motorcycle Mobile Unit',
  district TEXT NOT NULL DEFAULT 'District 5 - Culiat',
  contact_number TEXT,
  on_duty BOOLEAN NOT NULL DEFAULT true,
  lat NUMERIC DEFAULT 14.6738,
  lng NUMERIC DEFAULT 121.0504,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure lat and lng columns exist if the table was created in an earlier migration
ALTER TABLE public.officers ADD COLUMN IF NOT EXISTS lat NUMERIC DEFAULT 14.6738;
ALTER TABLE public.officers ADD COLUMN IF NOT EXISTS lng NUMERIC DEFAULT 121.0504;
ALTER TABLE public.officers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- -------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES (IDEMPOTENT)
-- -------------------------------------------------------------
ALTER TABLE public.citizen_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citizen_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citizen_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_nominations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.officers ENABLE ROW LEVEL SECURITY;

-- Citizen Profiles
DROP POLICY IF EXISTS "citizen_profiles_select" ON public.citizen_profiles;
DROP POLICY IF EXISTS "citizen_profiles_insert" ON public.citizen_profiles;
DROP POLICY IF EXISTS "citizen_profiles_update" ON public.citizen_profiles;
DROP POLICY IF EXISTS "citizen_profiles_delete" ON public.citizen_profiles;

CREATE POLICY "citizen_profiles_select" ON public.citizen_profiles FOR SELECT USING (true);
CREATE POLICY "citizen_profiles_insert" ON public.citizen_profiles FOR INSERT WITH CHECK (length(full_name) >= 2 AND length(email) >= 5);
CREATE POLICY "citizen_profiles_update" ON public.citizen_profiles FOR UPDATE USING (id IS NOT NULL);
CREATE POLICY "citizen_profiles_delete" ON public.citizen_profiles FOR DELETE USING (auth.role() = 'authenticated' AND id IS NOT NULL);

-- Citizen Vehicles
DROP POLICY IF EXISTS "citizen_vehicles_select" ON public.citizen_vehicles;
DROP POLICY IF EXISTS "citizen_vehicles_insert" ON public.citizen_vehicles;
DROP POLICY IF EXISTS "citizen_vehicles_update" ON public.citizen_vehicles;
DROP POLICY IF EXISTS "citizen_vehicles_delete" ON public.citizen_vehicles;

CREATE POLICY "citizen_vehicles_select" ON public.citizen_vehicles FOR SELECT USING (true);
CREATE POLICY "citizen_vehicles_insert" ON public.citizen_vehicles FOR INSERT WITH CHECK (length(plate_number) >= 3);
CREATE POLICY "citizen_vehicles_update" ON public.citizen_vehicles FOR UPDATE USING (id IS NOT NULL);
CREATE POLICY "citizen_vehicles_delete" ON public.citizen_vehicles FOR DELETE USING (id IS NOT NULL);

-- Citizen Vouchers
DROP POLICY IF EXISTS "citizen_vouchers_select" ON public.citizen_vouchers;
DROP POLICY IF EXISTS "citizen_vouchers_insert" ON public.citizen_vouchers;
DROP POLICY IF EXISTS "citizen_vouchers_update" ON public.citizen_vouchers;
DROP POLICY IF EXISTS "citizen_vouchers_delete" ON public.citizen_vouchers;

CREATE POLICY "citizen_vouchers_select" ON public.citizen_vouchers FOR SELECT USING (true);
CREATE POLICY "citizen_vouchers_insert" ON public.citizen_vouchers FOR INSERT WITH CHECK (length(code) >= 3);
CREATE POLICY "citizen_vouchers_update" ON public.citizen_vouchers FOR UPDATE USING (id IS NOT NULL);
CREATE POLICY "citizen_vouchers_delete" ON public.citizen_vouchers FOR DELETE USING (id IS NOT NULL);

-- Driver Nominations
DROP POLICY IF EXISTS "driver_nominations_select" ON public.driver_nominations;
DROP POLICY IF EXISTS "driver_nominations_insert" ON public.driver_nominations;
DROP POLICY IF EXISTS "driver_nominations_update" ON public.driver_nominations;
DROP POLICY IF EXISTS "driver_nominations_delete" ON public.driver_nominations;

CREATE POLICY "driver_nominations_select" ON public.driver_nominations FOR SELECT USING (true);
CREATE POLICY "driver_nominations_insert" ON public.driver_nominations FOR INSERT WITH CHECK (length(nominee_name) >= 2 AND length(nominee_license) >= 4);
CREATE POLICY "driver_nominations_update" ON public.driver_nominations FOR UPDATE USING (id IS NOT NULL);
CREATE POLICY "driver_nominations_delete" ON public.driver_nominations FOR DELETE USING (auth.role() = 'authenticated' AND id IS NOT NULL);

-- Officers
DROP POLICY IF EXISTS "officers_select" ON public.officers;
DROP POLICY IF EXISTS "officers_insert" ON public.officers;
DROP POLICY IF EXISTS "officers_update" ON public.officers;
DROP POLICY IF EXISTS "officers_delete" ON public.officers;

CREATE POLICY "officers_select" ON public.officers FOR SELECT USING (true);
CREATE POLICY "officers_insert" ON public.officers FOR INSERT WITH CHECK (length(badge_number) >= 3);
CREATE POLICY "officers_update" ON public.officers FOR UPDATE USING (id IS NOT NULL);
CREATE POLICY "officers_delete" ON public.officers FOR DELETE USING (auth.role() = 'authenticated' AND id IS NOT NULL);

-- -------------------------------------------------------------
-- SEED INITIAL CITIZEN & OFFICER DATA (SAFE & IDEMPOTENT)
-- -------------------------------------------------------------
DO $$
DECLARE
  v_citizen_id UUID := 'a0000000-0000-0000-0000-000000000001'::UUID;
BEGIN
  -- Insert Primary Demo Citizen Profile
  INSERT INTO public.citizen_profiles (id, full_name, email, phone, address, driver_license_number, tokens)
  VALUES (
    v_citizen_id,
    'Juan Dela Cruz',
    'juan.delacruz@gmail.com',
    '0917-123-4567',
    '124 Visayas Avenue, Barangay Culiat, Quezon City',
    'N01-20-994812',
    280
  )
  ON CONFLICT (email) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      tokens = EXCLUDED.tokens;

  -- Insert Demo Citizen Vehicles (skip if already inserted)
  IF NOT EXISTS (SELECT 1 FROM public.citizen_vehicles WHERE citizen_id = v_citizen_id AND plate_number = 'NDB 8921') THEN
    INSERT INTO public.citizen_vehicles (citizen_id, plate_number, make_model, vehicle_type, status, lto_expiry, lto_alarm_status)
    VALUES (v_citizen_id, 'NDB 8921', 'Toyota Vios 1.3E Silver', 'Sedan', 'verified', '2027-12-31', 'CLEARED');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.citizen_vehicles WHERE citizen_id = v_citizen_id AND plate_number = 'CAS 3901') THEN
    INSERT INTO public.citizen_vehicles (citizen_id, plate_number, make_model, vehicle_type, status, lto_expiry, lto_alarm_status)
    VALUES (v_citizen_id, 'CAS 3901', 'Toyota Fortuner 2.8 Black', 'SUV', 'verified', '2028-06-30', 'WARNING_DUE_SOON');
  END IF;

  -- Insert Demo Citizen Vouchers (skip if already inserted)
  IF NOT EXISTS (SELECT 1 FROM public.citizen_vouchers WHERE citizen_id = v_citizen_id AND code = 'QC-ECO-100') THEN
    INSERT INTO public.citizen_vouchers (citizen_id, code, title, description, cost, status)
    VALUES (v_citizen_id, 'QC-ECO-100', '₱100 Petron QC Fuel Card', 'Usable at all Quezon City Petron stations.', 50, 'active');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.citizen_vouchers WHERE citizen_id = v_citizen_id AND code = 'QC-EMISSION-FREE') THEN
    INSERT INTO public.citizen_vouchers (citizen_id, code, title, description, cost, status)
    VALUES (v_citizen_id, 'QC-EMISSION-FREE', 'Free LTO Emission Testing Fee', 'Waives 100% of LTO Private Emission Testing fee.', 80, 'active');
  END IF;

  -- Insert Enforcement Officers
  INSERT INTO public.officers (full_name, badge_number, rank, unit, district, contact_number, on_duty, lat, lng)
  VALUES
    ('Enforcer Roberto Santos', 'QC-ENF-0142', 'Traffic Enforcer II', 'Motorcycle Intercept', 'District 5 - Culiat', '0918-111-2222', true, 14.6738, 121.0504),
    ('Enforcer Dennis Gomez', 'QC-ENF-0089', 'Traffic Patrol Lead', 'Commonwealth Corridor Team', 'District 5 - Culiat', '0919-222-3333', true, 14.7008, 121.0876),
    ('Enforcer Maria Alcantara', 'QC-ENF-0210', 'Senior Enforcer', 'Tomas Morato Marshal', 'District 4 - Diliman', '0920-333-4444', true, 14.6349, 121.0356),
    ('Enforcer Alexander Reyes', 'QC-ENF-0305', 'Traffic Enforcer I', 'Tandang Sora Station', 'District 5 - Culiat', '0921-444-5555', false, 14.6685, 121.0620),
    ('Enforcer Jonathan Cruz', 'QC-ENF-0177', 'Motorcycle Mobile Unit', 'Visayas Ave Green Wave', 'District 6 - Central', '0922-555-6666', true, 14.6542, 121.0489)
  ON CONFLICT (badge_number) DO NOTHING;
END $$;
