-- Create countries table with country codes and phone prefixes
CREATE TABLE public.countries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  code text NOT NULL UNIQUE, -- ISO country code (TG, BF, CI, etc.)
  phone_prefix text NOT NULL, -- +228, +226, +225, etc.
  flag_emoji text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create mobile operators table linked to countries
CREATE TABLE public.mobile_operators (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  country_id uuid NOT NULL REFERENCES public.countries(id),
  number_patterns text[] NOT NULL, -- Array of regex patterns for validation
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert countries data
INSERT INTO public.countries (name, code, phone_prefix, flag_emoji) VALUES
('Togo', 'TG', '+228', '🇹🇬'),
('Burkina Faso', 'BF', '+226', '🇧🇫'),
('Côte d''Ivoire', 'CI', '+225', '🇨🇮'),
('Mali', 'ML', '+223', '🇲🇱'),
('Sénégal', 'SN', '+221', '🇸🇳'),
('Niger', 'NE', '+227', '🇳🇪'),
('Bénin', 'BJ', '+229', '🇧🇯'),
('Guinée', 'GN', '+224', '🇬🇳');

-- Insert mobile operators for each country
-- Togo operators
INSERT INTO public.mobile_operators (name, country_id, number_patterns) 
SELECT 'Togocel', id, ARRAY['^(70|71|72|73)[0-9]{6}$', '^9[0-9]{7}$'] FROM public.countries WHERE code = 'TG';

INSERT INTO public.mobile_operators (name, country_id, number_patterns) 
SELECT 'Moov Togo', id, ARRAY['^(96|97|98|99)[0-9]{6}$'] FROM public.countries WHERE code = 'TG';

-- Burkina Faso operators
INSERT INTO public.mobile_operators (name, country_id, number_patterns) 
SELECT 'Orange BF', id, ARRAY['^(60|61|62|63|64|65|66|67|68|69)[0-9]{6}$'] FROM public.countries WHERE code = 'BF';

INSERT INTO public.mobile_operators (name, country_id, number_patterns) 
SELECT 'Moov BF', id, ARRAY['^(70|71|72|73|74|75|76|77|78|79)[0-9]{6}$'] FROM public.countries WHERE code = 'BF';

INSERT INTO public.mobile_operators (name, country_id, number_patterns) 
SELECT 'Telecel Faso', id, ARRAY['^(50|51|52|53|54|55|56|57|58|59)[0-9]{6}$'] FROM public.countries WHERE code = 'BF';

-- Côte d'Ivoire operators
INSERT INTO public.mobile_operators (name, country_id, number_patterns) 
SELECT 'Orange CI', id, ARRAY['^(08|09|48|49|58|59|68|69|78|79|88|89)[0-9]{6}$'] FROM public.countries WHERE code = 'CI';

INSERT INTO public.mobile_operators (name, country_id, number_patterns) 
SELECT 'MTN CI', id, ARRAY['^(04|05|06|14|15|16|24|25|26|44|45|46|54|55|56|64|65|66|74|75|76|84|85|86)[0-9]{6}$'] FROM public.countries WHERE code = 'CI';

INSERT INTO public.mobile_operators (name, country_id, number_patterns) 
SELECT 'Moov CI', id, ARRAY['^(01|02|03|11|12|13|21|22|23|41|42|43|51|52|53|61|62|63|71|72|73|81|82|83)[0-9]{6}$'] FROM public.countries WHERE code = 'CI';

-- Mali operators
INSERT INTO public.mobile_operators (name, country_id, number_patterns) 
SELECT 'Orange Mali', id, ARRAY['^(60|61|62|63|64|65|66|67|68|69)[0-9]{6}$'] FROM public.countries WHERE code = 'ML';

INSERT INTO public.mobile_operators (name, country_id, number_patterns) 
SELECT 'Malitel', id, ARRAY['^(70|71|72|73|74|75|76|77|78|79)[0-9]{6}$'] FROM public.countries WHERE code = 'ML';

-- Add RLS policies
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_operators ENABLE ROW LEVEL SECURITY;

-- Everyone can view countries and operators
CREATE POLICY "Countries are viewable by everyone" 
ON public.countries 
FOR SELECT 
USING (true);

CREATE POLICY "Mobile operators are viewable by everyone" 
ON public.mobile_operators 
FOR SELECT 
USING (true);

-- Service role can manage
CREATE POLICY "Service role can manage countries" 
ON public.countries 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can manage mobile operators" 
ON public.mobile_operators 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Update existing constraint to use dynamic operators
ALTER TABLE public.offramp_requests 
DROP CONSTRAINT offramp_requests_momo_provider_check;

ALTER TABLE public.onramp_requests 
DROP CONSTRAINT IF EXISTS onramp_requests_momo_provider_check;

-- Add country_id columns to existing tables
ALTER TABLE public.offramp_requests 
ADD COLUMN country_id uuid REFERENCES public.countries(id);

ALTER TABLE public.onramp_requests 
ADD COLUMN country_id uuid REFERENCES public.countries(id);

-- Add triggers for updated_at
CREATE TRIGGER update_countries_updated_at
BEFORE UPDATE ON public.countries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mobile_operators_updated_at
BEFORE UPDATE ON public.mobile_operators
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();