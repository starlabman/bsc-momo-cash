
-- Table to control which blockchain networks are visible on the homepage
CREATE TABLE public.blockchain_visibility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id text NOT NULL UNIQUE,
  network_name text NOT NULL,
  is_visible boolean NOT NULL DEFAULT true,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blockchain_visibility ENABLE ROW LEVEL SECURITY;

-- Everyone can read visibility settings (needed for homepage)
CREATE POLICY "Anyone can view blockchain visibility"
ON public.blockchain_visibility FOR SELECT
USING (true);

-- Only service role can modify
CREATE POLICY "Service role can manage blockchain visibility"
ON public.blockchain_visibility FOR ALL
USING (true)
WITH CHECK (true);

-- Seed with all 9 supported networks (all visible by default)
INSERT INTO public.blockchain_visibility (network_id, network_name, is_visible) VALUES
  ('base', 'Base', true),
  ('bsc', 'Binance Smart Chain', true),
  ('ethereum', 'Ethereum', true),
  ('arbitrum', 'Arbitrum One', true),
  ('optimism', 'Optimism', true),
  ('polygon', 'Polygon', true),
  ('solana', 'Solana', true),
  ('avalanche', 'Avalanche', true),
  ('lisk', 'Lisk', true);

-- Trigger for updated_at
CREATE TRIGGER update_blockchain_visibility_updated_at
  BEFORE UPDATE ON public.blockchain_visibility
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
