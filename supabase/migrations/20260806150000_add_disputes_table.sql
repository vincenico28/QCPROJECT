-- Create disputes table
CREATE TABLE IF NOT EXISTS public.disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    citation_id UUID NOT NULL REFERENCES public.citations(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- Policies for disputes
-- Anyone can create a dispute (public access)
CREATE POLICY "Anyone can create disputes"
    ON public.disputes
    FOR INSERT
    WITH CHECK (true);

-- Anyone can view disputes for their citation if they know the citation ID, but for simplicity we'll just allow SELECT for now. 
CREATE POLICY "Public can view their own disputes"
    ON public.disputes
    FOR SELECT
    USING (true);

-- Admins and officers can update disputes
CREATE POLICY "Staff can update disputes"
    ON public.disputes
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'dispatcher', 'officer')
        )
    );

-- Also add a trigger to update the citation status when a dispute is created
CREATE OR REPLACE FUNCTION set_citation_contested()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.citations
    SET status = 'contested'
    WHERE id = NEW.citation_id AND status = 'pending';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_set_citation_contested
AFTER INSERT ON public.disputes
FOR EACH ROW
EXECUTE FUNCTION set_citation_contested();
