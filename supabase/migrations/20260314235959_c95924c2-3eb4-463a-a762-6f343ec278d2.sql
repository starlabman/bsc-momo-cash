
-- Create country_visibility table
CREATE TABLE public.country_visibility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id uuid NOT NULL REFERENCES public.countries(id) ON DELETE CASCADE,
  country_name text NOT NULL,
  country_code text NOT NULL,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(country_id)
);

-- Enable RLS
ALTER TABLE public.country_visibility ENABLE ROW LEVEL SECURITY;

-- Anyone can view country visibility
CREATE POLICY "Anyone can view country visibility"
ON public.country_visibility
FOR SELECT
TO public
USING (true);

-- Service role can manage country visibility
CREATE POLICY "Service role can manage country visibility"
ON public.country_visibility
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Insert existing countries into country_visibility
INSERT INTO public.country_visibility (country_id, country_name, country_code, is_visible)
SELECT id, name, code, true FROM public.countries;
