
-- 1. Fix admin_audit_logs: change "Service role can manage audit logs" from public to service_role
DROP POLICY IF EXISTS "Service role can manage audit logs" ON public.admin_audit_logs;
CREATE POLICY "Service role can manage audit logs"
ON public.admin_audit_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 2. Fix blockchain_scan_state: change from public to service_role
DROP POLICY IF EXISTS "Service role can manage scan state" ON public.blockchain_scan_state;
CREATE POLICY "Service role can manage scan state"
ON public.blockchain_scan_state
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. Fix blockchain_visibility: change from public to service_role
DROP POLICY IF EXISTS "Service role can manage blockchain visibility" ON public.blockchain_visibility;
CREATE POLICY "Service role can manage blockchain visibility"
ON public.blockchain_visibility
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 4. Fix mobile_operators: change from public to service_role
DROP POLICY IF EXISTS "Service role can manage mobile operators" ON public.mobile_operators;
CREATE POLICY "Service role can manage mobile operators"
ON public.mobile_operators
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 5. Fix countries: change from public to service_role
DROP POLICY IF EXISTS "Service role can manage countries" ON public.countries;
CREATE POLICY "Service role can manage countries"
ON public.countries
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 6. Fix offramp_requests payment link policy: require token match via RPC
DROP POLICY IF EXISTS "Anyone can view offramp request by valid payment link" ON public.offramp_requests;
-- No longer expose all active payment link rows. Access is only via edge function with service_role.

-- 7. Fix onramp_requests payment link policy: same fix
DROP POLICY IF EXISTS "Anyone can view onramp request by valid payment link" ON public.onramp_requests;
-- No longer expose all active payment link rows. Access is only via edge function with service_role.

-- 8. Fix validate_admin_jwt search_path
CREATE OR REPLACE FUNCTION public.validate_admin_jwt(p_token text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  token_data json;
  expires_at bigint;
  now_timestamp bigint;
BEGIN
  BEGIN
    token_data := p_token::json;
  EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
  END;
  
  IF token_data->>'admin_id' IS NULL OR 
     token_data->>'expires_at' IS NULL OR 
     token_data->>'token_type' IS NULL THEN
    RETURN FALSE;
  END IF;
  
  IF token_data->>'token_type' != 'admin_access' THEN
    RETURN FALSE;
  END IF;
  
  BEGIN
    expires_at := floor((token_data->>'expires_at')::numeric)::bigint;
    now_timestamp := floor(extract(epoch from now()))::bigint;
  EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
  END;
  
  IF now_timestamp > expires_at THEN
    RETURN FALSE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE id = (token_data->>'admin_id')::uuid
    AND username = token_data->>'username'
  );
END;
$function$;
