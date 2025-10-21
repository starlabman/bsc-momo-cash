-- Add network column to blockchain_events table
ALTER TABLE public.blockchain_events 
ADD COLUMN network TEXT NOT NULL DEFAULT 'bsc';

-- Add index for better query performance on network
CREATE INDEX idx_blockchain_events_network ON public.blockchain_events(network);

-- Add comment
COMMENT ON COLUMN public.blockchain_events.network IS 'Blockchain network identifier (base, bsc, ethereum, arbitrum, optimism, polygon, solana)';