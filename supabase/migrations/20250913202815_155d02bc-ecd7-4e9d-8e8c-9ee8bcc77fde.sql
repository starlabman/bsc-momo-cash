-- Ajouter les opérateurs manquants pour les pays sans opérateurs

-- Opérateurs pour le Bénin
INSERT INTO public.mobile_operators (country_id, name, number_patterns) VALUES
((SELECT id FROM countries WHERE code = 'BJ'), 'MTN', ARRAY['22996', '22997', '22953', '22954', '22955', '22956']),
((SELECT id FROM countries WHERE code = 'BJ'), 'Moov', ARRAY['22998', '22999', '22961', '22962', '22966', '22967']);

-- Opérateurs pour la Guinée  
INSERT INTO public.mobile_operators (country_id, name, number_patterns) VALUES
((SELECT id FROM countries WHERE code = 'GN'), 'Orange', ARRAY['22460', '22461', '22462', '22463']),
((SELECT id FROM countries WHERE code = 'GN'), 'MTN', ARRAY['22466', '22467', '22468', '22469']);

-- Opérateurs pour le Niger
INSERT INTO public.mobile_operators (country_id, name, number_patterns) VALUES
((SELECT id FROM countries WHERE code = 'NE'), 'Orange', ARRAY['22796', '22797', '22798', '22799']),
((SELECT id FROM countries WHERE code = 'NE'), 'Moov', ARRAY['22790', '22791', '22792', '22793']);

-- Opérateurs pour le Sénégal
INSERT INTO public.mobile_operators (country_id, name, number_patterns) VALUES
((SELECT id FROM countries WHERE code = 'SN'), 'Orange', ARRAY['22177', '22178', '22170']),
((SELECT id FROM countries WHERE code = 'SN'), 'Free', ARRAY['22130', '22131', '22132']),
((SELECT id FROM countries WHERE code = 'SN'), 'Expresso', ARRAY['22133', '22134', '22135']);