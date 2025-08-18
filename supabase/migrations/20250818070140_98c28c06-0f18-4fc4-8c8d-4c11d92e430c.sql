-- Fix OTP expiry configuration to meet security standards
-- Set OTP expiry to 10 minutes (600 seconds) which is within recommended threshold
UPDATE auth.config 
SET otp_expiry = 600 
WHERE key = 'OTP_EXPIRY';