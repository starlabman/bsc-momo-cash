
-- Add is_visible column to mobile_operators
ALTER TABLE public.mobile_operators ADD COLUMN IF NOT EXISTS is_visible boolean NOT NULL DEFAULT true;

-- Create token_visibility table
CREATE TABLE IF NOT EXISTS public.token_visibility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id text NOT NULL,
  token_symbol text NOT NULL,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (network_id, token_symbol)
);

-- RLS for token_visibility
ALTER TABLE public.token_visibility ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view token visibility" ON public.token_visibility
  FOR SELECT TO public USING (true);

CREATE POLICY "Service role can manage token visibility" ON public.token_visibility
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Seed token_visibility with all network/token combos
INSERT INTO public.token_visibility (network_id, token_symbol) VALUES
  ('base', 'USDC'), ('base', 'USDT'),
  ('bsc', 'USDC'), ('bsc', 'USDT'),
  ('ethereum', 'USDC'), ('ethereum', 'USDT'),
  ('arbitrum', 'USDC'), ('arbitrum', 'USDT'),
  ('optimism', 'USDC'), ('optimism', 'USDT'),
  ('polygon', 'USDC'), ('polygon', 'USDT'),
  ('solana', 'USDC'), ('solana', 'USDT'),
  ('avalanche', 'USDC'), ('avalanche', 'USDT'),
  ('lisk', 'USDC'), ('lisk', 'USDT')
ON CONFLICT (network_id, token_symbol) DO NOTHING;
