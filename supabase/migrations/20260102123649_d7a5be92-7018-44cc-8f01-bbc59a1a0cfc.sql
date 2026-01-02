-- Enable realtime for offramp_requests
ALTER TABLE public.offramp_requests REPLICA IDENTITY FULL;

-- Enable realtime for onramp_requests  
ALTER TABLE public.onramp_requests REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.offramp_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.onramp_requests;