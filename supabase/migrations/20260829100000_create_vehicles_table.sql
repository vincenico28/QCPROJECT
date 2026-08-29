-- Create vehicles table for the registry
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plate_number TEXT NOT NULL UNIQUE,
    make_model TEXT,
    registered_owner TEXT,
    color TEXT,
    chassis_number TEXT,
    registration_status TEXT DEFAULT 'CURRENT',
    risk_level TEXT DEFAULT 'Clean',
    lto_alarm_tagged BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view vehicles"
    ON public.vehicles
    FOR SELECT
    USING (true);

CREATE POLICY "Admin and staff can insert vehicles"
    ON public.vehicles
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'super_admin', 'dispatcher', 'officer')
        )
    );

CREATE POLICY "Admin and staff can update vehicles"
    ON public.vehicles
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'super_admin', 'dispatcher', 'officer')
        )
    );

-- Add a trigger to update 'updated_at' column
CREATE OR REPLACE FUNCTION update_vehicles_updated_at()
RETURNS TRIGGER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_vehicles_updated_at
BEFORE UPDATE ON public.vehicles
FOR EACH ROW
EXECUTE FUNCTION update_vehicles_updated_at();
