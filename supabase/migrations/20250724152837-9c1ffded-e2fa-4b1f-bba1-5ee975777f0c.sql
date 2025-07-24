-- Create table for exchange rate configuration
CREATE TABLE public.exchange_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  base_currency TEXT NOT NULL DEFAULT 'USD',
  target_currency TEXT NOT NULL DEFAULT 'XOF',
  rate DECIMAL(18,6) NOT NULL,
  margin DECIMAL(5,4) NOT NULL DEFAULT 0.10, -- 10% margin by default
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for crypto off-ramp requests
CREATE TABLE public.offramp_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  amount DECIMAL(18,6) NOT NULL CHECK (amount > 0 AND amount <= 1000),
  token TEXT NOT NULL CHECK (token IN ('USDC', 'USDT')),
  momo_number TEXT NOT NULL,
  momo_provider TEXT CHECK (momo_provider IN ('Moov', 'MTN', 'Orange', 'Wave')),
  usd_amount DECIMAL(18,6) NOT NULL,
  xof_amount DECIMAL(18,2) NOT NULL,
  exchange_rate DECIMAL(18,6) NOT NULL,
  bsc_address TEXT NOT NULL DEFAULT '0x742d35Cc6646Ae9875C7D8DA12b40d4b5EC5d7a4', -- Custodial wallet address
  transaction_hash TEXT,
  status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'received', 'processing', 'paid', 'failed')),
  request_ip TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for transaction monitoring logs
CREATE TABLE public.blockchain_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_hash TEXT NOT NULL,
  block_number BIGINT,
  token_address TEXT NOT NULL,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  amount DECIMAL(18,6) NOT NULL,
  token_symbol TEXT NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  offramp_request_id UUID REFERENCES public.offramp_requests(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_offramp_requests_status ON public.offramp_requests(status);
CREATE INDEX idx_offramp_requests_created_at ON public.offramp_requests(created_at);
CREATE INDEX idx_blockchain_events_hash ON public.blockchain_events(transaction_hash);
CREATE INDEX idx_blockchain_events_processed ON public.blockchain_events(processed);
CREATE INDEX idx_exchange_rates_updated ON public.exchange_rates(last_updated);

-- Enable Row Level Security
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offramp_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_events ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth required for MVP)
CREATE POLICY "Anyone can view current exchange rates" 
ON public.exchange_rates 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can view offramp requests" 
ON public.offramp_requests 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create offramp requests" 
ON public.offramp_requests 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update offramp requests" 
ON public.offramp_requests 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can view blockchain events" 
ON public.blockchain_events 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create blockchain events" 
ON public.blockchain_events 
FOR INSERT 
WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_offramp_requests_updated_at
BEFORE UPDATE ON public.offramp_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial exchange rate data
INSERT INTO public.exchange_rates (base_currency, target_currency, rate, margin) 
VALUES ('USD', 'XOF', 600.00, 0.10);