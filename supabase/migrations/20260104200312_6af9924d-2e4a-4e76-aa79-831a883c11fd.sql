-- Ajouter une colonne pour les numéros de dépôt des opérateurs
ALTER TABLE public.mobile_operators 
ADD COLUMN deposit_number text;

-- Mettre à jour les numéros de dépôt pour le Togo
UPDATE public.mobile_operators 
SET deposit_number = '98244850' 
WHERE name = 'Moov Togo';

UPDATE public.mobile_operators 
SET deposit_number = '93742473' 
WHERE name = 'Togocel';