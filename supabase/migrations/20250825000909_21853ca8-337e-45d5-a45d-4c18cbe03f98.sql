-- Create admin audit logs table for comprehensive security monitoring
CREATE TABLE public.admin_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL,
  admin_username TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for admin audit logs
CREATE POLICY "Admins can view audit logs" 
ON public.admin_audit_logs 
FOR SELECT 
USING (is_admin_user());

CREATE POLICY "Service role can manage audit logs" 
ON public.admin_audit_logs 
FOR ALL 
USING (true);

-- Create index for performance
CREATE INDEX idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);
CREATE INDEX idx_admin_audit_logs_admin_id ON public.admin_audit_logs(admin_id);
CREATE INDEX idx_admin_audit_logs_entity ON public.admin_audit_logs(entity_type, entity_id);

-- Update admin JWT creation function to use 15 minutes expiry
CREATE OR REPLACE FUNCTION public.create_admin_jwt(p_admin_id uuid, p_username text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Return a structured token with shorter 15-minute expiry
  RETURN json_build_object(
    'admin_id', p_admin_id,
    'username', p_username,
    'issued_at', extract(epoch from now()),
    'expires_at', extract(epoch from now() + interval '15 minutes'),
    'token_type', 'admin_access'
  )::text;
END;
$function$;