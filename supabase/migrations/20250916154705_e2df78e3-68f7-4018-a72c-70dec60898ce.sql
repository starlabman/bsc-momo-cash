-- Fix security issue: Update the get_request_stats function with proper search_path
DROP FUNCTION IF EXISTS get_request_stats();

CREATE OR REPLACE FUNCTION get_request_stats()
RETURNS JSON AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'pending_payment', COALESCE((SELECT COUNT(*) FROM offramp_requests WHERE status = 'pending_payment'), 0),
    'received', COALESCE((SELECT COUNT(*) FROM offramp_requests WHERE status = 'received'), 0),
    'processing', COALESCE((SELECT COUNT(*) FROM offramp_requests WHERE status = 'processing'), 0),
    'paid', COALESCE((SELECT COUNT(*) FROM offramp_requests WHERE status = 'paid'), 0),
    'failed', COALESCE((SELECT COUNT(*) FROM offramp_requests WHERE status = 'failed'), 0),
    'total_offramp', COALESCE((SELECT COUNT(*) FROM offramp_requests), 0),
    'total_onramp', COALESCE((SELECT COUNT(*) FROM onramp_requests), 0),
    'pending_onramp', COALESCE((SELECT COUNT(*) FROM onramp_requests WHERE status = 'pending_momo_payment'), 0),
    'completed_onramp', COALESCE((SELECT COUNT(*) FROM onramp_requests WHERE status = 'completed'), 0),
    'total_volume_usd', COALESCE((SELECT SUM(usd_amount) FROM offramp_requests), 0),
    'total_volume_xof', COALESCE((SELECT SUM(xof_amount) FROM offramp_requests), 0)
  ) INTO stats;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public', 'pg_temp';