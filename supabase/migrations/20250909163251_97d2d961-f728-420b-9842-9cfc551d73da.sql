-- CRITICAL SECURITY FIX: Remove public access to sensitive tables
-- This migration fixes multiple critical security vulnerabilities

-- 1. Remove public access from admin_users table
DROP POLICY IF EXISTS "Only authenticated admins can view admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Service role can read admin users" ON public.admin_users;

-- Create admin-only access policy for admin_users
CREATE POLICY "Admin users can only be accessed by service role"
ON public.admin_users
FOR ALL
USING (false)  -- No public access at all
WITH CHECK (false);  -- No public inserts/updates

-- 2. Remove public access from offramp_requests table  
DROP POLICY IF EXISTS "Service role can view offramp requests" ON public.offramp_requests;
DROP POLICY IF EXISTS "Service role can create offramp requests" ON public.offramp_requests;
DROP POLICY IF EXISTS "Service role can update offramp requests" ON public.offramp_requests;

-- Recreate with proper admin-only access
CREATE POLICY "Admin users can view offramp requests"
ON public.offramp_requests
FOR SELECT
USING (is_admin_user());

CREATE POLICY "Service role can manage offramp requests"
ON public.offramp_requests
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. Remove public access from onramp_requests table
DROP POLICY IF EXISTS "Service role can view onramp requests" ON public.onramp_requests;
DROP POLICY IF EXISTS "Service role can create onramp requests" ON public.onramp_requests;
DROP POLICY IF EXISTS "Service role can update onramp requests" ON public.onramp_requests;

-- Recreate with proper admin-only access
CREATE POLICY "Admin users can view onramp requests"
ON public.onramp_requests
FOR SELECT
USING (is_admin_user());

CREATE POLICY "Service role can manage onramp requests"
ON public.onramp_requests
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 4. Fix admin_audit_logs access (already has proper admin-only access)
-- The audit logs already have correct policies, but let's ensure they're optimal

-- 5. Fix blockchain_events access
DROP POLICY IF EXISTS "Service role can manage blockchain events" ON public.blockchain_events;

CREATE POLICY "Admin users can view blockchain events"
ON public.blockchain_events
FOR SELECT
USING (is_admin_user());

CREATE POLICY "Service role can manage blockchain events"
ON public.blockchain_events
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add a comment for documentation
COMMENT ON TABLE public.admin_users IS 'Admin user credentials - SERVICE ROLE ACCESS ONLY';
COMMENT ON TABLE public.offramp_requests IS 'Sensitive financial data - ADMIN ACCESS ONLY';
COMMENT ON TABLE public.onramp_requests IS 'Sensitive financial data - ADMIN ACCESS ONLY';
COMMENT ON TABLE public.blockchain_events IS 'Blockchain transaction data - ADMIN ACCESS ONLY';