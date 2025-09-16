-- Create the get_request_stats RPC function
CREATE OR REPLACE FUNCTION get_request_stats()
RETURNS JSON AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'total_offramp', COALESCE((SELECT COUNT(*) FROM offramp_requests), 0),
    'pending_offramp', COALESCE((SELECT COUNT(*) FROM offramp_requests WHERE status = 'pending'), 0),
    'completed_offramp', COALESCE((SELECT COUNT(*) FROM offramp_requests WHERE status = 'completed'), 0),
    'total_onramp', COALESCE((SELECT COUNT(*) FROM onramp_requests), 0),
    'pending_onramp', COALESCE((SELECT COUNT(*) FROM onramp_requests WHERE status = 'pending'), 0),
    'completed_onramp', COALESCE((SELECT COUNT(*) FROM onramp_requests WHERE status = 'completed'), 0)
  ) INTO stats;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;