-- Vérifier les valeurs de l'enum reservation_status
-- Affiche toutes les valeurs valides
SELECT enumlabel 
FROM pg_enum 
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
WHERE pg_type.typname = 'reservation_status'
ORDER BY enumsortorder;

-- Vérifier aussi la structure de la table reservations
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'reservations'
ORDER BY ordinal_position;
