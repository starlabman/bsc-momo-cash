-- Fix security warnings by setting search_path for all functions

-- Update verify_admin_credentials function with search_path
CREATE OR REPLACE FUNCTION public.verify_admin_credentials(
  p_username TEXT,
  p_password TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  stored_hash TEXT;
BEGIN
  SELECT password_hash INTO stored_hash
  FROM public.admin_users
  WHERE username = p_username;
  
  IF stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- For now, we'll do simple text comparison
  -- In production, you'd use proper password hashing
  RETURN stored_hash = p_password;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Update get_request_stats function with search_path
CREATE OR REPLACE FUNCTION public.get_request_stats()
RETURNS json AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'pending_payment', COALESCE((SELECT COUNT(*) FROM public.offramp_requests WHERE status = 'pending_payment'), 0),
    'received', COALESCE((SELECT COUNT(*) FROM public.offramp_requests WHERE status = 'received'), 0),
    'processing', COALESCE((SELECT COUNT(*) FROM public.offramp_requests WHERE status = 'processing'), 0),
    'paid', COALESCE((SELECT COUNT(*) FROM public.offramp_requests WHERE status = 'paid'), 0),
    'failed', COALESCE((SELECT COUNT(*) FROM public.offramp_requests WHERE status = 'failed'), 0),
    'total_volume_usd', COALESCE((SELECT SUM(usd_amount) FROM public.offramp_requests), 0),
    'total_volume_xof', COALESCE((SELECT SUM(xof_amount) FROM public.offramp_requests), 0)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Update update_updated_at_column function with search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;