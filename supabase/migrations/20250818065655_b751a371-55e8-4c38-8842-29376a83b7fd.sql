-- Phase 1: Critical Security Fixes (Fixed)

-- First, let's remove the overly permissive public policies that expose sensitive data
DROP POLICY IF EXISTS "Anyone can view blockchain events" ON public.blockchain_events;
DROP POLICY IF EXISTS "Anyone can create blockchain events" ON public.blockchain_events;
DROP POLICY IF EXISTS "Allow creation of offramp requests" ON public.offramp_requests;

-- Create admin-only policies for blockchain events
CREATE POLICY "Admins can view blockchain events" ON public.blockchain_events
FOR SELECT USING (is_admin_user());

CREATE POLICY "Service role can manage blockchain events" ON public.blockchain_events
FOR ALL USING (true);

-- Add pgcrypto extension for password hashing
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
  now_timestamp bigint;
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
  now_timestamp := extract(epoch from now());
  
  IF now_timestamp > expires_at THEN
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