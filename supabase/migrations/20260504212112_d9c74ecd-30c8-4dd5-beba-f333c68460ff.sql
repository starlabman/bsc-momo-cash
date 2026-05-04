
-- 1. Disable forgeable admin check; admin access must go through service-role edge functions
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT false;
$$;

-- 2. Remove sensitive tables from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.offramp_requests;
ALTER PUBLICATION supabase_realtime DROP TABLE public.onramp_requests;

-- 3. Restrict exchange_rates SELECT to service role only
DROP POLICY IF EXISTS "Anyone can view current exchange rates" ON public.exchange_rates;

CREATE POLICY "Service role can read exchange rates"
ON public.exchange_rates
FOR SELECT
TO service_role
USING (true);
