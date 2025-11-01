-- Add payment link functionality to offramp and onramp requests

-- Add payment link token and expiry to offramp_requests
ALTER TABLE offramp_requests 
ADD COLUMN payment_link_token TEXT UNIQUE,
ADD COLUMN link_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN paid_via_link BOOLEAN DEFAULT FALSE,
ADD COLUMN requester_name TEXT,
ADD COLUMN requester_info JSONB;

-- Add payment link token and expiry to onramp_requests
ALTER TABLE onramp_requests 
ADD COLUMN payment_link_token TEXT UNIQUE,
ADD COLUMN link_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN paid_via_link BOOLEAN DEFAULT FALSE,
ADD COLUMN requester_name TEXT,
ADD COLUMN requester_info JSONB;

-- Create index for faster lookups by payment link token
CREATE INDEX idx_offramp_payment_link_token ON offramp_requests(payment_link_token) WHERE payment_link_token IS NOT NULL;
CREATE INDEX idx_onramp_payment_link_token ON onramp_requests(payment_link_token) WHERE payment_link_token IS NOT NULL;

-- RLS policy to allow anyone to view requests by payment link token (for payment page)
CREATE POLICY "Anyone can view offramp request by valid payment link"
ON offramp_requests FOR SELECT
USING (
  payment_link_token IS NOT NULL 
  AND (link_expires_at IS NULL OR link_expires_at > now())
);

CREATE POLICY "Anyone can view onramp request by valid payment link"
ON onramp_requests FOR SELECT
USING (
  payment_link_token IS NOT NULL 
  AND (link_expires_at IS NULL OR link_expires_at > now())
);