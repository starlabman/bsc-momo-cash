-- First, drop the overly permissive policies
DROP POLICY IF EXISTS "Anyone can view offramp requests" ON public.offramp_requests;
DROP POLICY IF EXISTS "Anyone can update offramp requests" ON public.offramp_requests;
DROP POLICY IF EXISTS "Anyone can create offramp requests" ON public.offramp_requests;

-- Fix the function search path security warning
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = 'public', 'pg_temp'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE username = current_setting('request.jwt.claims', true)::json->>'username'
  );
$$;

-- Create restrictive RLS policies
-- Policy: Only service role can create offramp requests (for the edge function)
CREATE POLICY "Service role can create offramp requests" 
ON public.offramp_requests 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- Policy: Only service role can view offramp requests (for admin dashboard edge function)
CREATE POLICY "Service role can view offramp requests" 
ON public.offramp_requests 
FOR SELECT 
TO service_role
USING (true);

-- Policy: Only service role can update offramp requests (for admin dashboard edge function)
CREATE POLICY "Service role can update offramp requests" 
ON public.offramp_requests 
FOR UPDATE 
TO service_role
USING (true);

-- No public access to sensitive data