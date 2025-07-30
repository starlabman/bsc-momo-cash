-- Créer la table admin_users
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insérer l'utilisateur admin par défaut (mot de passe: admin123)
INSERT INTO public.admin_users (username, password_hash) 
VALUES ('admin', 'admin123')
ON CONFLICT (username) DO NOTHING;

-- Activer RLS sur la table admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Créer une politique pour permettre la lecture (nécessaire pour la fonction d'authentification)
CREATE POLICY "Service role can read admin users" 
ON public.admin_users 
FOR SELECT 
TO service_role
USING (true);