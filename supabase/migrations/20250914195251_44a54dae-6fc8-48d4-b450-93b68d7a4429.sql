-- Fix admin password verification function to handle both $2a$ and $2b$ bcrypt hashes
CREATE OR REPLACE FUNCTION public.verify_admin_password(p_username text, p_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
DECLARE
  stored_hash TEXT;
BEGIN
  SELECT password_hash INTO stored_hash
  FROM public.admin_users
  WHERE username = p_username;
  
  IF stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if password is already hashed (starts with $2a$ or $2b$ for bcrypt)
  IF stored_hash LIKE '$2a$%' OR stored_hash LIKE '$2b$%' THEN
    -- Use crypt function to verify bcrypt hash
    RETURN crypt(p_password, stored_hash) = stored_hash;
  ELSE
    -- Legacy plain text comparison (temporary during migration)
    RETURN stored_hash = p_password;
  END IF;
END;
$$;

-- Ensure we have a test admin user with correct bcrypt hash
-- Password will be 'admin123' for testing
INSERT INTO public.admin_users (username, password_hash) 
VALUES ('admin', crypt('admin123', gen_salt('bf')))
ON CONFLICT (username) 
DO UPDATE SET password_hash = crypt('admin123', gen_salt('bf'))
WHERE admin_users.username = 'admin';

-- Add a unique constraint on username if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'admin_users_username_key'
    ) THEN
        ALTER TABLE public.admin_users ADD CONSTRAINT admin_users_username_key UNIQUE (username);
    END IF;
END
$$;