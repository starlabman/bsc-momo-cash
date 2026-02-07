
-- Table to track the last scanned block per network for the polling monitor
CREATE TABLE public.blockchain_scan_state (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  network text NOT NULL UNIQUE,
  last_scanned_block bigint NOT NULL DEFAULT 0,
  last_scan_at timestamp with time zone DEFAULT now(),
  is_scanning boolean NOT NULL DEFAULT false,
  error_count integer NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blockchain_scan_state ENABLE ROW LEVEL SECURITY;

-- Only service role can manage scan state
CREATE POLICY "Service role can manage scan state"
ON public.blockchain_scan_state
FOR ALL
USING (true)
WITH CHECK (true);

-- Admin can view scan state
CREATE POLICY "Admins can view scan state"
ON public.blockchain_scan_state
FOR SELECT
USING (is_admin_user());

-- Add updated_at trigger
CREATE TRIGGER update_blockchain_scan_state_updated_at
BEFORE UPDATE ON public.blockchain_scan_state
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial state for all 9 networks
INSERT INTO public.blockchain_scan_state (network, last_scanned_block) VALUES
  ('base', 0),
  ('bsc', 0),
  ('ethereum', 0),
  ('arbitrum', 0),
  ('optimism', 0),
  ('polygon', 0),
  ('solana', 0),
  ('avalanche', 0),
  ('lisk', 0);

-- Add webhook_source column to blockchain_events for tracking origin
ALTER TABLE public.blockchain_events 
ADD COLUMN IF NOT EXISTS webhook_source text DEFAULT 'polling',
ADD COLUMN IF NOT EXISTS confirmed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS matched_request_type text,
ADD COLUMN IF NOT EXISTS matched_at timestamp with time zone;
