-- Update the momo_provider check constraint to include Togocel
ALTER TABLE public.offramp_requests 
DROP CONSTRAINT offramp_requests_momo_provider_check;

ALTER TABLE public.offramp_requests 
ADD CONSTRAINT offramp_requests_momo_provider_check 
CHECK (momo_provider = ANY (ARRAY['Moov'::text, 'MTN'::text, 'Orange'::text, 'Wave'::text, 'Togocel'::text]));

-- Also update the onramp_requests table to be consistent
ALTER TABLE public.onramp_requests 
DROP CONSTRAINT IF EXISTS onramp_requests_momo_provider_check;

ALTER TABLE public.onramp_requests 
ADD CONSTRAINT onramp_requests_momo_provider_check 
CHECK (momo_provider = ANY (ARRAY['Moov'::text, 'MTN'::text, 'Orange'::text, 'Wave'::text, 'Togocel'::text]));