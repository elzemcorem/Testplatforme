-- DIAGNOSTIC COMPLET: Découvrir les vraies valeurs de l'enum reservation_status

-- 1. Afficher toutes les valeurs valides de l'enum
SELECT enumlabel as valid_status_value
FROM pg_enum
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
WHERE pg_type.typname = 'reservation_status'
ORDER BY enumsortorder;

-- 2. Vérifier la structure de la colonne status
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_name = 'reservations' AND column_name = 'status';

-- 3. Vérifier quelques réservations existantes et leurs statuts
SELECT id, status, created_at
FROM reservations
LIMIT 5;

-- 4. Si l'enum a besoin d'être modifié, vérifier ce qui est utilisé actuellement
SELECT DISTINCT status
FROM reservations
ORDER BY status;
