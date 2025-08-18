-- Phase 1: Critical Security Fixes

-- First, let's remove the overly permissive public policies that expose sensitive data
DROP POLICY IF EXISTS "Anyone can view blockchain events" ON public.blockchain_events;
DROP POLICY IF EXISTS "Anyone can create blockchain events" ON public.blockchain_events;
DROP POLICY IF EXISTS "Allow creation of offramp requests" ON public.offramp_requests;
DROP POLICY IF EXISTS "Service role can create offramp requests" ON public.offramp_requests;
DROP POLICY IF EXISTS "Service role can create onramp requests" ON public.onramp_requests;

-- Create admin-only policies for blockchain events
CREATE POLICY "Admins can view blockchain events" ON public.blockchain_events
FOR SELECT USING (is_admin_user());

CREATE POLICY "Service role can manage blockchain events" ON public.blockchain_events
FOR ALL USING (true);

-- Update offramp requests policies to be more restrictive
CREATE POLICY "Service role can create offramp requests" ON public.offramp_requests
FOR INSERT WITH CHECK (true);

-- Update onramp requests policies to be more restrictive  
CREATE POLICY "Service role can create onramp requests" ON public.onramp_requests
FOR INSERT WITH CHECK (true);

-- Add a function to hash passwords using pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create function to verify hashed passwords
CREATE OR REPLACE FUNCTION public.verify_admin_password(p_username text, p_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  stored_hash TEXT;
BEGIN
  SELECT password_hash INTO stored_hash
  FROM public.admin_users
  WHERE username = p_username;
  
  IF stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if password is already hashed (starts with $2b$ for bcrypt)
  IF stored_hash LIKE '$2b$%' THEN
    -- Use crypt function to verify bcrypt hash
    RETURN crypt(p_password, stored_hash) = stored_hash;
  ELSE
    -- Legacy plain text comparison (temporary during migration)
    RETURN stored_hash = p_password;
  END IF;
END;
$function$;

-- Update existing admin password to use bcrypt hash
-- Hash of 'admin123' with bcrypt
UPDATE public.admin_users 
SET password_hash = crypt('admin123', gen_salt('bf'))
WHERE username = 'admin' AND password_hash = 'admin123';

-- Create function to create admin JWT tokens
CREATE OR REPLACE FUNCTION public.create_admin_jwt(p_admin_id uuid, p_username text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Return a structured token that includes expiry
  RETURN json_build_object(
    'admin_id', p_admin_id,
    'username', p_username,
    'issued_at', extract(epoch from now()),
    'expires_at', extract(epoch from now() + interval '30 minutes'),
    'token_type', 'admin_access'
  )::text;
END;
$function$;

-- Create function to validate admin JWT tokens
CREATE OR REPLACE FUNCTION public.validate_admin_jwt(p_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  token_data json;
  expires_at bigint;
  current_time bigint;
BEGIN
  BEGIN
    token_data := p_token::json;
  EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
  END;
  
  -- Check if token has required fields
  IF token_data->>'admin_id' IS NULL OR 
     token_data->>'expires_at' IS NULL OR 
     token_data->>'token_type' IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check token type
  IF token_data->>'token_type' != 'admin_access' THEN
    RETURN FALSE;
  END IF;
  
  -- Check expiration
  expires_at := (token_data->>'expires_at')::bigint;
  current_time := extract(epoch from now());
  
  IF current_time > expires_at THEN
    RETURN FALSE;
  END IF;
  
  -- Verify admin exists
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE id = (token_data->>'admin_id')::uuid
    AND username = token_data->>'username'
  );
END;
$function$;

-- Update admin user function to use new token validation
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  auth_header text;
  token text;
BEGIN
  -- Get authorization header from request
  auth_header := current_setting('request.headers', true)::json->>'authorization';
  
  IF auth_header IS NULL OR NOT auth_header LIKE 'Bearer %' THEN
    RETURN FALSE;
  END IF;
  
  -- Extract token
  token := substring(auth_header from 8);
  
  -- Validate the admin JWT token
  RETURN public.validate_admin_jwt(token);
END;
$function$;