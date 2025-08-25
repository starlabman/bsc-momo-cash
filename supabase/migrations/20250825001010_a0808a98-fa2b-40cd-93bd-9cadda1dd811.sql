-- Fix OTP expiry to meet security standards (set to 5 minutes)
-- Note: This requires manual configuration in Supabase Auth settings
-- This migration creates a reminder to update the auth configuration

-- Create a function to remind about OTP expiry configuration
CREATE OR REPLACE FUNCTION public.reminder_configure_otp_expiry()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE NOTICE 'SECURITY REMINDER: Please set OTP expiry to 300 seconds (5 minutes) in Supabase Auth settings';
  RAISE NOTICE 'Navigate to: Auth > Settings > Auth Configuration and set OTP Expiry to 300';
END;
$$;

-- Execute the reminder
SELECT public.reminder_configure_otp_expiry();