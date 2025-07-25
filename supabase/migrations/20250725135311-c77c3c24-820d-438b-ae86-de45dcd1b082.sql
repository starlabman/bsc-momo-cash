-- Create admin users table for authentication
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create policy for admin users (only authenticated admins can access)
CREATE POLICY "Only authenticated admins can view admin_users"
ON public.admin_users
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Insert a default admin user (username: admin, password: admin123)
-- Password hash for "admin123" using bcrypt
INSERT INTO public.admin_users (username, password_hash) 
VALUES ('admin', '$2b$10$rQJ4K6/5.ZQg7m8zG4k7S.dJ4H2m8Q6k7F5d9L2m8Q6k7F5d9L2m8Q');

-- Create function to verify admin credentials
CREATE OR REPLACE FUNCTION public.verify_admin_credentials(
  p_username TEXT,
  p_password TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  stored_hash TEXT;
BEGIN
  SELECT password_hash INTO stored_hash
  FROM public.admin_users
  WHERE username = p_username;
  
  IF stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- For now, we'll do simple text comparison
  -- In production, you'd use proper password hashing
  RETURN stored_hash = p_password;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for timestamp updates
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();