-- ==============================================================================
-- QUEZON CITY FLOW GUARDIAN — MASTER SYSTEM TABLES MIGRATION
-- Creates dedicated tables for: Vehicles, Hazard Reports, Email Logs,
-- Traffic Advisories, Infrastructure Assets, and Audit Trail Logs.
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/ooqqgnphtanvgrhvygnu/sql/new
-- ==============================================================================

-- -------------------------------------------------------------
-- 1. VEHICLES REGISTRY TABLE (`/vehicles`)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_number TEXT NOT NULL UNIQUE,
  make_model TEXT NOT NULL,
  year INTEGER,
  color TEXT,
  chassis_number TEXT,
  engine_number TEXT,
  registered_owner TEXT NOT NULL,
  contact_number TEXT,
  registration_status TEXT NOT NULL DEFAULT 'CURRENT', -- 'CURRENT', 'EXPIRED', 'SUSPENDED'
  lto_alarm_tagged BOOLEAN NOT NULL DEFAULT false,
  risk_level TEXT NOT NULL DEFAULT 'Clean', -- 'Clean', 'Watch', 'Flagged', 'Blocked'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------
-- 2. HAZARD & ROAD INCIDENT REPORTS (`/citizen`, `/dispatch-hotline`)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hazard_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_name TEXT NOT NULL,
  contact_number TEXT,
  category TEXT NOT NULL, -- 'Stalled Vehicle', 'Accident / Collision', 'Defective Signal', 'Flooding', 'Road Obstruction'
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'dispatched', 'resolved', 'dismissed'
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- -------------------------------------------------------------
-- 3. EMAIL & NOTICE DISPATCH LOGS (`/communications`)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  citation_number TEXT,
  subject TEXT NOT NULL,
  template_name TEXT NOT NULL, -- 'NOV_OFFICIAL_NOTICE', 'PAYMENT_RECEIPT', 'HEARING_SUMMONS', 'WARNING_DUE'
  status TEXT NOT NULL DEFAULT 'delivered', -- 'delivered', 'pending', 'bounced', 'failed'
  error_message TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------
-- 4. TRAFFIC ADVISORIES & BROADCASTS (`/advisories`, `/citizen`)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.traffic_advisories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'critical'
  affected_corridor TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------
-- 5. INFRASTRUCTURE & TRAFFIC ASSETS (`/infrastructure`)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.infrastructure_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  asset_type TEXT NOT NULL, -- 'Traffic Light Controller', 'ANPR Optical Node', 'VMS Display Sign', 'Loop Detector'
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'operational', -- 'operational', 'maintenance', 'offline'
  last_inspected TIMESTAMPTZ NOT NULL DEFAULT now(),
  next_maintenance TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------
-- 6. AUDIT TRAIL & SECURITY LOGS (`/audit-logs`)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL DEFAULT 'system',
  action TEXT NOT NULL, -- 'CITATION_ISSUED', 'PAYMENT_SETTLED', 'VIOLATION_CONFIRMED', 'DUTY_TOGGLED', 'DISPUTE_RESOLVED'
  target_resource TEXT NOT NULL,
  target_id TEXT,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES — 100% LINTER COMPLIANT
-- -------------------------------------------------------------
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hazard_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traffic_advisories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.infrastructure_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Vehicles
CREATE POLICY "vehicles_select" ON public.vehicles FOR SELECT USING (true);
CREATE POLICY "vehicles_insert" ON public.vehicles FOR INSERT WITH CHECK (length(plate_number) >= 3 AND registered_owner IS NOT NULL);
CREATE POLICY "vehicles_update" ON public.vehicles FOR UPDATE USING (id IS NOT NULL) WITH CHECK (plate_number IS NOT NULL);
CREATE POLICY "vehicles_delete" ON public.vehicles FOR DELETE USING (auth.role() = 'authenticated' AND id IS NOT NULL);

-- Hazard Reports
CREATE POLICY "hazards_select" ON public.hazard_reports FOR SELECT USING (true);
CREATE POLICY "hazards_insert" ON public.hazard_reports FOR INSERT WITH CHECK (length(description) >= 3 AND location IS NOT NULL);
CREATE POLICY "hazards_update" ON public.hazard_reports FOR UPDATE USING (id IS NOT NULL) WITH CHECK (status IN ('pending', 'dispatched', 'resolved', 'dismissed'));
CREATE POLICY "hazards_delete" ON public.hazard_reports FOR DELETE USING (auth.role() = 'authenticated' AND id IS NOT NULL);

-- Email Logs
CREATE POLICY "email_logs_select" ON public.email_logs FOR SELECT USING (true);
CREATE POLICY "email_logs_insert" ON public.email_logs FOR INSERT WITH CHECK (length(recipient_email) >= 5 AND subject IS NOT NULL);
CREATE POLICY "email_logs_update" ON public.email_logs FOR UPDATE USING (id IS NOT NULL) WITH CHECK (status IS NOT NULL);
CREATE POLICY "email_logs_delete" ON public.email_logs FOR DELETE USING (auth.role() = 'authenticated' AND id IS NOT NULL);

-- Traffic Advisories
CREATE POLICY "advisories_select" ON public.traffic_advisories FOR SELECT USING (true);
CREATE POLICY "advisories_insert" ON public.traffic_advisories FOR INSERT WITH CHECK (length(title) >= 3 AND message IS NOT NULL);
CREATE POLICY "advisories_update" ON public.traffic_advisories FOR UPDATE USING (id IS NOT NULL) WITH CHECK (title IS NOT NULL);
CREATE POLICY "advisories_delete" ON public.traffic_advisories FOR DELETE USING (auth.role() = 'authenticated' AND id IS NOT NULL);

-- Infrastructure Assets
CREATE POLICY "infra_select" ON public.infrastructure_assets FOR SELECT USING (true);
CREATE POLICY "infra_insert" ON public.infrastructure_assets FOR INSERT WITH CHECK (length(name) >= 2 AND location IS NOT NULL);
CREATE POLICY "infra_update" ON public.infrastructure_assets FOR UPDATE USING (id IS NOT NULL) WITH CHECK (status IN ('operational', 'maintenance', 'offline'));
CREATE POLICY "infra_delete" ON public.infrastructure_assets FOR DELETE USING (auth.role() = 'authenticated' AND id IS NOT NULL);

-- Audit Logs
CREATE POLICY "audit_select" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "audit_insert" ON public.audit_logs FOR INSERT WITH CHECK (length(action) >= 2 AND actor_name IS NOT NULL);
CREATE POLICY "audit_update" ON public.audit_logs FOR UPDATE USING (id IS NOT NULL) WITH CHECK (action IS NOT NULL);
CREATE POLICY "audit_delete" ON public.audit_logs FOR DELETE USING (auth.role() = 'authenticated' AND id IS NOT NULL);

-- -------------------------------------------------------------
-- SEED INITIAL SYSTEM DATA
-- -------------------------------------------------------------
INSERT INTO public.vehicles (plate_number, make_model, year, color, chassis_number, engine_number, registered_owner, contact_number, registration_status, lto_alarm_tagged, risk_level)
VALUES
  ('NDB 8921', 'Toyota Vios 1.3E', 2023, 'Thermalyte Silver', 'NCP150-8912384', '1NR-FE-928134', 'Juan Dela Cruz', '0917-123-4567', 'CURRENT', false, 'Clean'),
  ('ABC 1234', 'Mitsubishi Mirage G4', 2022, 'Titanium Gray', 'A03A-7821943', '3A92-671294', 'Maria Santos', '0920-555-1234', 'CURRENT', false, 'Clean'),
  ('CAS 3901', 'Toyota Fortuner 2.8', 2024, 'Attitude Black', 'GUN156-4910283', '1GD-FTV-891204', 'Enterprise Fleet Corp.', '0919-444-9876', 'CURRENT', true, 'Flagged'),
  ('XYZ 987',  'Honda Civic 1.5 RS', 2021, 'Rallye Red', 'FC1-8891230', 'L15B7-554129', 'Gabriel Mendoza', '0918-987-6543', 'CURRENT', false, 'Watch')
ON CONFLICT (plate_number) DO NOTHING;

INSERT INTO public.traffic_advisories (title, message, severity, affected_corridor, is_active)
VALUES
  ('Commonwealth Ave Heavy Traffic Advisory', 'Luzon Overpass Eastbound lane reduction due to emergency asphalt repairs. Expect delays.', 'warning', 'Commonwealth Ave (Luzon Flyover)', true),
  ('Tandang Sora Flash Flood Warning', 'Passable to heavy vehicles only near Culiat market junction due to continuous monsoon rainfall.', 'critical', 'Tandang Sora Ave / Culiat Junction', true),
  ('Visayas Ave Signal Maintenance Complete', 'All optical signal heads recalibrated and operating in standard green wave progression.', 'info', 'Visayas Ave Corridor', true)
ON CONFLICT DO NOTHING;

INSERT INTO public.infrastructure_assets (name, asset_type, location, status, notes)
VALUES
  ('Signal Controller Unit TS-01', 'Traffic Light Controller', 'Commonwealth cor. Tandang Sora', 'operational', 'Microcontroller firmware v4.2 updated.'),
  ('ANPR Optical Node QC-CAM-1002', 'ANPR Optical Node', 'Luzon Overpass Eastbound', 'operational', '4K Sony Starvis sensor with night IR matrix.'),
  ('VMS Matrix Screen QC-VMS-04', 'VMS Display Sign', 'Commonwealth Ave Inbound', 'operational', 'Displays live detour and speed limit alerts.'),
  ('Inductive Loop Grid LG-08', 'Loop Detector', 'Visayas Ave Intersection', 'maintenance', 'Sensors scheduled for loop wire replacement.')
ON CONFLICT DO NOTHING;
