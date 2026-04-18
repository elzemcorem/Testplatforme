-- FIX DEFINIF: Correction de l'enum reservation_status
-- Ajouter les valeurs manquantes à l'enum

-- Ajouter "confirmed" si elle n'existe pas
ALTER TYPE reservation_status ADD VALUE IF NOT EXISTS 'confirmed';

-- Ajouter "started" si elle n'existe pas  
ALTER TYPE reservation_status ADD VALUE IF NOT EXISTS 'started';

-- Ajouter "in_progress" si elle n'existe pas
ALTER TYPE reservation_status ADD VALUE IF NOT EXISTS 'in_progress';

-- Ajouter "active" si elle n'existe pas
ALTER TYPE reservation_status ADD VALUE IF NOT EXISTS 'active';

-- Afficher les valeurs finales
SELECT enumlabel as valid_status_values
FROM pg_enum
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
WHERE pg_type.typname = 'reservation_status'
ORDER BY enumsortorder;
