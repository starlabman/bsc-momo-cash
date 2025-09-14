-- Corriger tous les patterns des opérateurs mobiles pour être cohérents
-- Chaque pattern doit être une regex complète qui valide le numéro sans le préfixe pays

-- Mettre à jour les opérateurs du Bénin
UPDATE mobile_operators 
SET number_patterns = ARRAY['^(98|99|61|62|66|67)[0-9]{6}$']
WHERE name = 'Moov' AND country_id = (SELECT id FROM countries WHERE name = 'Bénin');

UPDATE mobile_operators 
SET number_patterns = ARRAY['^(96|97|53|54|55|56)[0-9]{6}$']
WHERE name = 'MTN' AND country_id = (SELECT id FROM countries WHERE name = 'Bénin');

-- Mettre à jour les opérateurs de la Guinée
UPDATE mobile_operators 
SET number_patterns = ARRAY['^(66|67|68|69)[0-9]{6}$']
WHERE name = 'MTN' AND country_id = (SELECT id FROM countries WHERE name = 'Guinée');

UPDATE mobile_operators 
SET number_patterns = ARRAY['^(60|61|62|63)[0-9]{6}$']
WHERE name = 'Orange' AND country_id = (SELECT id FROM countries WHERE name = 'Guinée');

-- Mettre à jour les opérateurs du Niger
UPDATE mobile_operators 
SET number_patterns = ARRAY['^(90|91|92|93)[0-9]{6}$']
WHERE name = 'Moov' AND country_id = (SELECT id FROM countries WHERE name = 'Niger');

UPDATE mobile_operators 
SET number_patterns = ARRAY['^(96|97|98|99)[0-9]{6}$']
WHERE name = 'Orange' AND country_id = (SELECT id FROM countries WHERE name = 'Niger');

-- Mettre à jour les opérateurs du Sénégal 
UPDATE mobile_operators 
SET number_patterns = ARRAY['^(33|34|35)[0-9]{6}$']
WHERE name = 'Expresso' AND country_id = (SELECT id FROM countries WHERE name = 'Sénégal');

UPDATE mobile_operators 
SET number_patterns = ARRAY['^(30|31|32)[0-9]{6}$']
WHERE name = 'Free' AND country_id = (SELECT id FROM countries WHERE name = 'Sénégal');

UPDATE mobile_operators 
SET number_patterns = ARRAY['^(77|78|70)[0-9]{6}$']
WHERE name = 'Orange' AND country_id = (SELECT id FROM countries WHERE name = 'Sénégal');

-- Ajouter Airtel Burkina Faso qui manquait
INSERT INTO mobile_operators (country_id, name, number_patterns)
SELECT id, 'Airtel BF', ARRAY['^(40|41|42|43|44|45|46|47|48|49)[0-9]{6}$']
FROM countries WHERE name = 'Burkina Faso'
ON CONFLICT DO NOTHING;

-- Ajouter des patterns plus précis pour Mali
UPDATE mobile_operators 
SET number_patterns = ARRAY['^(80|81|82|83|84|85|86|87|88|89)[0-9]{6}$']
WHERE name = 'Malitel' AND country_id = (SELECT id FROM countries WHERE name = 'Mali');

UPDATE mobile_operators 
SET number_patterns = ARRAY['^(60|61|62|63|64|65|66|67|68|69)[0-9]{6}$']
WHERE name = 'Orange Mali' AND country_id = (SELECT id FROM countries WHERE name = 'Mali');

-- Ajouter Orange Malitel (nouveau nom)  
INSERT INTO mobile_operators (country_id, name, number_patterns)
SELECT id, 'Orange Malitel', ARRAY['^(90|91|92|93|94|95|96|97|98|99)[0-9]{6}$']
FROM countries WHERE name = 'Mali'
ON CONFLICT DO NOTHING;