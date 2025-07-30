-- Mettre à jour le mot de passe admin en texte clair pour la démo
UPDATE public.admin_users 
SET password_hash = 'admin123' 
WHERE username = 'admin';