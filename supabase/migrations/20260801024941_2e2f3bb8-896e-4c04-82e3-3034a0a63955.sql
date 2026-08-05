CREATE TABLE public.dispatches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE DEFAULT ('DSP-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,6))),
  officer_id UUID REFERENCES public.officers(id) ON DELETE SET NULL,
  officer_name TEXT,
  badge_number TEXT,
  violation_id UUID REFERENCES public.violations(id) ON DELETE SET NULL,
  location TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  instructions TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT dispatches_priority_check CHECK (priority IN ('low','medium','high','critical')),
  CONSTRAINT dispatches_status_check CHECK (status IN ('queued','en_route','on_scene','resolved','cancelled'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dispatches TO authenticated;
GRANT ALL ON public.dispatches TO service_role;

ALTER TABLE public.dispatches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view dispatches" ON public.dispatches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can create dispatches" ON public.dispatches FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff can update dispatches" ON public.dispatches FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_dispatches_updated_at
BEFORE UPDATE ON public.dispatches
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_dispatches_created_at ON public.dispatches (created_at DESC);
CREATE INDEX idx_dispatches_status ON public.dispatches (status);
