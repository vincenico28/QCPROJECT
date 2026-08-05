CREATE TABLE public.officers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_number text NOT NULL UNIQUE,
  full_name text NOT NULL,
  rank text NOT NULL DEFAULT 'Enforcer I',
  unit text NOT NULL DEFAULT 'Traffic Enforcement Unit',
  district text NOT NULL DEFAULT 'District I',
  contact_number text,
  status text NOT NULL DEFAULT 'active',
  on_duty boolean NOT NULL DEFAULT false,
  citations_issued integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.officers TO authenticated;
GRANT ALL ON public.officers TO service_role;

ALTER TABLE public.officers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view officers" ON public.officers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage officers" ON public.officers FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_officers_updated_at BEFORE UPDATE ON public.officers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.officers (badge_number, full_name, rank, unit, district, contact_number, status, on_duty, citations_issued) VALUES
('7742', 'Ramon Rodriguez', 'Senior Enforcer III', 'Traffic Enforcement Unit', 'District I', '+63 917 442 1180', 'active', true, 184),
('6318', 'Maria Cristina Bautista', 'Enforcer II', 'Highway Patrol', 'District II', '+63 918 330 9821', 'active', true, 142),
('5507', 'Jose Antonio Villamor', 'Traffic Marshal', 'Anti-Colorum Task Force', 'District III', '+63 916 771 5540', 'active', false, 97),
('8891', 'Angela Marie Dizon', 'Enforcer I', 'CCTV Monitoring Center', 'District IV', '+63 915 220 7734', 'active', true, 63),
('4420', 'Benjamin Salazar', 'Senior Enforcer II', 'Traffic Enforcement Unit', 'District V', '+63 917 884 3312', 'on_leave', false, 210),
('9134', 'Katrina Lopez', 'Enforcer II', 'Motorcycle Response Team', 'District VI', '+63 919 445 6620', 'active', true, 118),
('3276', 'Elmer Concepcion', 'Traffic Marshal', 'Highway Patrol', 'District II', '+63 920 118 4407', 'suspended', false, 41),
('7015', 'Patricia Anne Reyes', 'Enforcer I', 'Digital Citation Desk', 'District I', '+63 917 662 9013', 'active', true, 76);

DROP POLICY IF EXISTS "Public read access" ON public.cameras;
DROP POLICY IF EXISTS "Public read cameras" ON public.cameras;
DROP POLICY IF EXISTS "Anyone can view cameras" ON public.cameras;
DROP POLICY IF EXISTS "Public read access" ON public.violations;
DROP POLICY IF EXISTS "Public read violations" ON public.violations;
DROP POLICY IF EXISTS "Anyone can view violations" ON public.violations;
DROP POLICY IF EXISTS "Public read access" ON public.citations;
DROP POLICY IF EXISTS "Public read citations" ON public.citations;
DROP POLICY IF EXISTS "Anyone can view citations" ON public.citations;

DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname, tablename FROM pg_policies
    WHERE schemaname='public' AND tablename IN ('cameras','violations','citations')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, p.tablename);
  END LOOP;
END $$;

REVOKE ALL ON public.cameras FROM anon;
REVOKE ALL ON public.violations FROM anon;
REVOKE ALL ON public.citations FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cameras TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.violations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.citations TO authenticated;
GRANT ALL ON public.cameras TO service_role;
GRANT ALL ON public.violations TO service_role;
GRANT ALL ON public.citations TO service_role;

ALTER TABLE public.cameras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view cameras" ON public.cameras FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage cameras" ON public.cameras FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Staff can view violations" ON public.violations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage violations" ON public.violations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Staff can view citations" ON public.citations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage citations" ON public.citations FOR ALL TO authenticated USING (true) WITH CHECK (true);