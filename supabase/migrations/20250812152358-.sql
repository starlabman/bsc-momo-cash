-- Enable Row Level Security on offramp_requests table
ALTER TABLE public.offramp_requests ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE username = current_setting('request.jwt.claims', true)::json->>'username'
  );
$$;

-- Policy: Only admins can view all offramp requests
CREATE POLICY "Admins can view all offramp requests" 
ON public.offramp_requests 
FOR SELECT 
USING (public.is_admin_user());

-- Policy: Only admins can update offramp requests
CREATE POLICY "Admins can update offramp requests" 
ON public.offramp_requests 
FOR UPDATE 
USING (public.is_admin_user());

-- Policy: Allow creation of offramp requests (for public API)
CREATE POLICY "Allow creation of offramp requests" 
ON public.offramp_requests 
FOR INSERT 
WITH CHECK (true);

-- Policy: No delete access
CREATE POLICY "No delete access" 
ON public.offramp_requests 
FOR DELETE 
USING (false);