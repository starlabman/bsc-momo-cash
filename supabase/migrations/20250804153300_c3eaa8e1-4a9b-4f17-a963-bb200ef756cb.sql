-- Update the default BSC address for offramp requests
ALTER TABLE public.offramp_requests 
ALTER COLUMN bsc_address SET DEFAULT '0xf249F24182CdE7bAd264B60Ed38727Fd3674FE6A';

-- Update any existing pending requests to use the new address
UPDATE public.offramp_requests 
SET bsc_address = '0xf249F24182CdE7bAd264B60Ed38727Fd3674FE6A'
WHERE status = 'pending_payment';