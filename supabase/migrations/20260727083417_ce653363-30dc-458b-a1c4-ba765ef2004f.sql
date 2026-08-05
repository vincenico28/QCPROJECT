
-- CAMERAS
CREATE TABLE public.cameras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'online',
  lat NUMERIC,
  lng NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cameras TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cameras TO authenticated;
GRANT ALL ON public.cameras TO service_role;
ALTER TABLE public.cameras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cameras public read" ON public.cameras FOR SELECT USING (true);
CREATE POLICY "cameras staff write" ON public.cameras FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- VIOLATIONS
CREATE TABLE public.violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_number TEXT NOT NULL,
  violation_type TEXT NOT NULL,
  location TEXT NOT NULL,
  confidence NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  evidence_url TEXT,
  ai_detected BOOLEAN NOT NULL DEFAULT true,
  camera_code TEXT,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.violations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.violations TO authenticated;
GRANT ALL ON public.violations TO service_role;
ALTER TABLE public.violations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "violations public read" ON public.violations FOR SELECT USING (true);
CREATE POLICY "violations staff write" ON public.violations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX violations_detected_at_idx ON public.violations (detected_at DESC);

-- CITATIONS
CREATE TABLE public.citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citation_number TEXT NOT NULL UNIQUE,
  violation_id UUID REFERENCES public.violations(id) ON DELETE SET NULL,
  plate_number TEXT NOT NULL,
  vehicle_model TEXT,
  offense TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  officer_name TEXT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.citations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.citations TO authenticated;
GRANT ALL ON public.citations TO service_role;
ALTER TABLE public.citations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "citations public read" ON public.citations FOR SELECT USING (true);
CREATE POLICY "citations staff write" ON public.citations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX citations_issued_at_idx ON public.citations (issued_at DESC);

-- SEED CAMERAS
INSERT INTO public.cameras (code, location, status, lat, lng) VALUES
  ('CAM-042', 'Commonwealth Ave', 'online', 14.7008, 121.0876),
  ('CAM-108', 'Tomas Morato', 'alert', 14.6349, 121.0356),
  ('CAM-059', 'EDSA-Quezon Ave', 'online', 14.6432, 121.0374),
  ('CAM-021', 'Katipunan Flyover', 'online', 14.6339, 121.0742),
  ('CAM-077', 'Aurora Blvd', 'offline', 14.6215, 121.0530),
  ('CAM-133', 'Elliptical Road', 'online', 14.6486, 121.0466);

-- SEED VIOLATIONS
INSERT INTO public.violations (plate_number, violation_type, location, confidence, status, camera_code, detected_at) VALUES
  ('ABC 1234', 'Obstruction of Traffic', 'Commonwealth Ave', 98.2, 'pending', 'CAM-042', now() - interval '2 minutes'),
  ('XYZ 9876', 'Beating the Red Light', 'Quezon Ave', 84.5, 'pending', 'CAM-059', now() - interval '6 minutes'),
  ('NMB 4452', 'Illegal Lane Change', 'EDSA North', 91.1, 'pending', 'CAM-059', now() - interval '11 minutes'),
  ('GHY 9921', 'Illegal Parking', 'Tomas Morato', 94.1, 'pending', 'CAM-108', now() - interval '18 minutes'),
  ('LKM 3341', 'No Helmet', 'Katipunan Flyover', 88.4, 'confirmed', 'CAM-021', now() - interval '32 minutes'),
  ('WHI 9981', 'Overspeeding', 'Elliptical Road', 92.7, 'confirmed', 'CAM-133', now() - interval '54 minutes'),
  ('NDG 4412', 'Counterflow', 'Aurora Blvd', 89.9, 'dismissed', 'CAM-077', now() - interval '2 hours'),
  ('QRS 7788', 'Triple Riding', 'Commonwealth Ave', 76.3, 'pending', 'CAM-042', now() - interval '3 hours');

-- SEED CITATIONS
INSERT INTO public.citations (citation_number, plate_number, vehicle_model, offense, amount, status, officer_name, issued_at) VALUES
  ('QC-88219', 'NDG 4412', 'Toyota Vios',    'Obstruction',        2000, 'paid',      'Ofc. Santos',   now() - interval '1 hour'),
  ('QC-88218', 'ABC 1234', 'Honda Click',    'No Helmet',          1500, 'pending',   'Ofc. Rodriguez',now() - interval '2 hours'),
  ('QC-88217', 'WHI 9981', 'Honda Civic',    'Overspeeding',       3000, 'contested', 'Ofc. Cruz',     now() - interval '4 hours'),
  ('QC-88216', 'LOK 0091', 'Isuzu Truck',    'No Entry Zone',      5000, 'pending',   'Ofc. Reyes',    now() - interval '6 hours'),
  ('QC-88215', 'ZXC 4451', 'Honda Civic',    'Red Light Jump',     3500, 'pending',   'Ofc. Santos',   now() - interval '8 hours'),
  ('QC-88214', 'NBQ 1288', 'Toyota Fortuner','Obstruction',        2000, 'paid',      'Ofc. Rodriguez',now() - interval '10 hours'),
  ('QC-88213', 'JKL 5566', 'Mitsubishi Mirage','Illegal Parking',  1000, 'paid',      'Ofc. Cruz',     now() - interval '14 hours'),
  ('QC-88212', 'MNP 2211', 'Ford Ranger',    'Counterflow',        2500, 'contested', 'Ofc. Reyes',    now() - interval '20 hours');
