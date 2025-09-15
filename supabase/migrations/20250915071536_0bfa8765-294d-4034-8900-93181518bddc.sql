-- Activer l'extension pgcrypto pour le hachage des mots de passe
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Vérifier que l'extension est bien activée
SELECT extname FROM pg_extension WHERE extname = 'pgcrypto';