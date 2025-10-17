-- Fix admin JWT validation to handle decimal timestamps correctly
CREATE OR REPLACE FUNCTION public.create_admin_jwt(
  p_admin_id uuid,
  p_username text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return a structured token with timestamps as integers (removing decimals)
  RETURN json_build_object(
    'admin_id', p_admin_id,
    'username', p_username,
    'issued_at', floor(extract(epoch from now()))::bigint,
    'expires_at', floor(extract(epoch from now() + interval '15 minutes'))::bigint,
    'token_type', 'admin_access'
  )::text;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_admin_jwt(p_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  token_data json;
  expires_at bigint;
  now_timestamp bigint;
BEGIN
  -- Parse JSON token
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
  
  -- Check expiration - use floor to handle any decimal values
  BEGIN
    expires_at := floor((token_data->>'expires_at')::numeric)::bigint;
    now_timestamp := floor(extract(epoch from now()))::bigint;
  EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
  END;
  
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
$$;