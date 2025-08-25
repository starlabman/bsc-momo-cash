-- Fix search path security issue for the reminder function
CREATE OR REPLACE FUNCTION public.reminder_configure_otp_expiry()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  RAISE NOTICE 'SECURITY REMINDER: Please set OTP expiry to 300 seconds (5 minutes) in Supabase Auth settings';
  RAISE NOTICE 'Navigate to: Auth > Settings > Auth Configuration and set OTP Expiry to 300';
END;
$$;