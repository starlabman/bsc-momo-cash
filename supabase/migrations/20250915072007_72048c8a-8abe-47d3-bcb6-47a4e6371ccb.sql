-- Mettre à jour le mot de passe admin avec un mot de passe simple pour tester
UPDATE admin_users 
SET password_hash = 'admin123' 
WHERE username = 'admin';