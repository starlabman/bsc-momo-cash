-- Create onramp_requests table for Mobile Money to Crypto conversions
CREATE TABLE public.onramp_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  xof_amount NUMERIC NOT NULL,
  usd_amount NUMERIC NOT NULL,
  crypto_amount NUMERIC NOT NULL,
  exchange_rate NUMERIC NOT NULL,
  token TEXT NOT NULL,
  momo_number TEXT NOT NULL,
  momo_provider TEXT,
  recipient_address TEXT NOT NULL,
  request_ip TEXT,
  notes TEXT,
  transaction_hash TEXT,
  status TEXT NOT NULL DEFAULT 'pending_momo_payment',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.onramp_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for onramp_requests (similar to offramp_requests)
CREATE POLICY "Service role can create onramp requests" 
ON public.onramp_requests 
FOR INSERT 
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can view onramp requests" 
ON public.onramp_requests 
FOR SELECT 
TO service_role
USING (true);

CREATE POLICY "Service role can update onramp requests" 
ON public.onramp_requests 
FOR UPDATE 
TO service_role
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_onramp_requests_updated_at
BEFORE UPDATE ON public.onramp_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();