-- Remove old check constraints that only allow 'USDC' or 'USDT'
ALTER TABLE offramp_requests DROP CONSTRAINT IF EXISTS offramp_requests_token_check;
ALTER TABLE onramp_requests DROP CONSTRAINT IF EXISTS onramp_requests_token_check;

-- Add new check constraints that allow token-network format (e.g., 'USDC-BSC', 'USDT-ETHEREUM')
ALTER TABLE offramp_requests ADD CONSTRAINT offramp_requests_token_check 
  CHECK (token ~* '^(USDC|USDT)(-[A-Z]+)?$');

ALTER TABLE onramp_requests ADD CONSTRAINT onramp_requests_token_check 
  CHECK (token ~* '^(USDC|USDT)(-[A-Z]+)?$');