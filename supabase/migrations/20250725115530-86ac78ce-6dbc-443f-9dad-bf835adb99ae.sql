-- Create function to get dashboard statistics  
CREATE OR REPLACE FUNCTION public.get_request_stats()
RETURNS JSON AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;