-- Remove policies depending on is_admin_user() (the function always returns false, so these granted no access)
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "Admin users can view blockchain events" ON public.blockchain_events;
DROP POLICY IF EXISTS "Admins can view blockchain events" ON public.blockchain_events;
DROP POLICY IF EXISTS "Admins can view scan state" ON public.blockchain_scan_state;
DROP POLICY IF EXISTS "Admin users can view offramp requests" ON public.offramp_requests;
DROP POLICY IF EXISTS "Admins can update offramp requests" ON public.offramp_requests;
DROP POLICY IF EXISTS "Admins can view all offramp requests" ON public.offramp_requests;
DROP POLICY IF EXISTS "Admin users can view onramp requests" ON public.onramp_requests;

DROP FUNCTION IF EXISTS public.is_admin_user();

-- Revoke EXECUTE from anon/authenticated on SECURITY DEFINER functions; keep service_role only
REVOKE ALL ON FUNCTION public.create_admin_jwt(uuid, text) FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.validate_admin_jwt(text) FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.verify_admin_credentials(text, text) FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.verify_admin_password(text, text) FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.get_request_stats() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.generate_transaction_reference(text) FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.reminder_configure_otp_expiry() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.broadcast_tx_status_change() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.set_offramp_reference() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.set_onramp_reference() FROM anon, authenticated, public;

GRANT EXECUTE ON FUNCTION public.create_admin_jwt(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.validate_admin_jwt(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_admin_credentials(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_admin_password(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_request_stats() TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_transaction_reference(text) TO service_role;