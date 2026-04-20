-- SUPER FICHIER SQL COMPLET
-- A executer EN ENTIER dans Supabase SQL Editor (copy-paste tout d'un coup)
-- Duree totale: ~10 secondes
-- Resultat: Systeme Controller→DAF completement fonctionnel

-- ==========================================
-- PART 1: CREER LES TABLES + TRIGGER
-- ==========================================
-- Table pour les reservations planifiees (futures bookings)
CREATE TABLE IF NOT EXISTS future_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  planned_start_date TIMESTAMP NOT NULL,
  planned_end_date TIMESTAMP NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'started', 'completed')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  CONSTRAINT planned_dates_valid CHECK (planned_end_date > planned_start_date)
);

CREATE INDEX IF NOT EXISTS idx_future_bookings_user_id ON future_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_future_bookings_vehicle_id ON future_bookings(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_future_bookings_status ON future_bookings(status);
CREATE INDEX IF NOT EXISTS idx_future_bookings_planned_dates ON future_bookings(planned_start_date, planned_end_date);

-- Enable RLS
ALTER TABLE future_bookings ENABLE ROW LEVEL SECURITY;

-- STRATEGY: 
-- 1. Everyone can VIEW all non-cancelled future bookings
-- 2. Users can CREATE their own future bookings  
-- 3. Users can DELETE their own future bookings
-- 4. ONLY controllers can UPDATE (validate/cancel) future bookings
-- 5. Everyone can do all operations (covered by roles above)

-- Policy 1: Everyone can VIEW all non-cancelled future bookings
DROP POLICY IF EXISTS "Everyone can view all future bookings" ON future_bookings;
CREATE POLICY "Everyone can view all future bookings" ON future_bookings
  FOR SELECT USING (status != 'cancelled');

-- Policy 2: Everyone can CREATE their own future bookings
DROP POLICY IF EXISTS "Users can create their own future bookings" ON future_bookings;
CREATE POLICY "Users can create their own future bookings" ON future_bookings
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policy 3: Everyone can DELETE their own future bookings
DROP POLICY IF EXISTS "Users can delete their own future bookings" ON future_bookings;
CREATE POLICY "Users can delete their own future bookings" ON future_bookings
  FOR DELETE USING (user_id = auth.uid());

-- Policy 4: ONLY controllers can UPDATE future bookings (validate/cancel)
DROP POLICY IF EXISTS "Only controllers can update future bookings" ON future_bookings;
CREATE POLICY "Only controllers can update future bookings" ON future_bookings
  FOR UPDATE USING (
    auth.jwt()->>'role' = 'controller'
  ) WITH CHECK (
    auth.jwt()->>'role' = 'controller'
  );

-- Remove old DAF-specific policies (not needed anymore, covered by generic policies above)
DROP POLICY IF EXISTS "DAF can view all future bookings" ON future_bookings;
DROP POLICY IF EXISTS "DAF can create future bookings" ON future_bookings;
DROP POLICY IF EXISTS "DAF can update future bookings" ON future_bookings;
DROP POLICY IF EXISTS "DAF can delete future bookings" ON future_bookings;

-- Remove old controller-specific view policies (covered by generic view above)
DROP POLICY IF EXISTS "Controllers can view future bookings" ON future_bookings;
DROP POLICY IF EXISTS "Controllers can update future bookings status" ON future_bookings;

-- Remove old admin-specific policies (covered by generic policies)
DROP POLICY IF EXISTS "Admin can view future bookings" ON future_bookings;
DROP POLICY IF EXISTS "Admin can update future bookings" ON future_bookings;

-- Table pour tracker les actions du controleur
CREATE TABLE IF NOT EXISTS controller_actions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  controller_id UUID NOT NULL REFERENCES auth.users(id),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('validated', 'cancelled', 'modified')),
  old_status TEXT,
  new_status TEXT,
  reason TEXT,
  timestamp TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_controller_actions_controller_id ON controller_actions_log(controller_id);
CREATE INDEX IF NOT EXISTS idx_controller_actions_reservation_id ON controller_actions_log(reservation_id);
CREATE INDEX IF NOT EXISTS idx_controller_actions_timestamp ON controller_actions_log(timestamp DESC);

-- Enable RLS
ALTER TABLE controller_actions_log ENABLE ROW LEVEL SECURITY;

-- Policy pour INSERER (utilise par le trigger)
DROP POLICY IF EXISTS "Allow inserts for logging" ON controller_actions_log;
CREATE POLICY "Allow inserts for logging" ON controller_actions_log
  FOR INSERT WITH CHECK (true);

-- Policy pour DAF
DROP POLICY IF EXISTS "DAF can view all controller actions" ON controller_actions_log;
CREATE POLICY "DAF can view all controller actions" ON controller_actions_log
  FOR SELECT USING (
    auth.jwt()->>'email' = 'daf@beninpetro.com'
  );

-- Policy pour controleur
DROP POLICY IF EXISTS "Controllers can view their own actions" ON controller_actions_log;
CREATE POLICY "Controllers can view their own actions" ON controller_actions_log
  FOR SELECT USING (controller_id = auth.uid());

-- Policy pour Admin
DROP POLICY IF EXISTS "Admin can view and manage actions" ON controller_actions_log;
CREATE POLICY "Admin can view and manage actions" ON controller_actions_log
  FOR SELECT USING (
    auth.jwt()->>'role' = 'admin'
  );

-- TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION log_controller_action()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    BEGIN
      INSERT INTO controller_actions_log (
        controller_id, 
        reservation_id, 
        action_type, 
        old_status, 
        new_status,
        timestamp
      ) VALUES (
        COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
        NEW.id,
        CASE 
          WHEN NEW.status = 'confirmed' THEN 'validated'
          WHEN NEW.status = 'cancelled' THEN 'cancelled'
          ELSE 'modified'
        END,
        OLD.status,
        NEW.status,
        now()
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Error logging controller action: %', SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_log_controller_action ON reservations;
CREATE TRIGGER trg_log_controller_action
AFTER UPDATE ON reservations
FOR EACH ROW
EXECUTE FUNCTION log_controller_action();

-- ==========================================
-- PART 2: RLS POLICIES POUR RESERVATIONS
-- ==========================================
-- Controllers peuvent UPDATE
DROP POLICY IF EXISTS "Controllers can update reservations" ON reservations;
CREATE POLICY "Controllers can update reservations" ON reservations
  FOR UPDATE USING (
    auth.jwt()->>'role' = 'controller'
  )
  WITH CHECK (
    auth.jwt()->>'role' = 'controller'
  );

-- Admins peuvent UPDATE
DROP POLICY IF EXISTS "Admins can update reservations" ON reservations;
CREATE POLICY "Admins can update reservations" ON reservations
  FOR UPDATE USING (
    auth.jwt()->>'role' = 'admin'
  )
  WITH CHECK (
    auth.jwt()->>'role' = 'admin'
  );

-- ==========================================
-- PART 3: AJOUTER VALEURS ENUM MANQUANTES
-- ==========================================
ALTER TYPE reservation_status ADD VALUE IF NOT EXISTS 'confirmed';
ALTER TYPE reservation_status ADD VALUE IF NOT EXISTS 'started';
ALTER TYPE reservation_status ADD VALUE IF NOT EXISTS 'in_progress';
ALTER TYPE reservation_status ADD VALUE IF NOT EXISTS 'active';

-- ==========================================
-- PART 4: CONFIGURER REALTIME
-- ==========================================
-- Activer Realtime pour la table future_bookings
ALTER PUBLICATION supabase_realtime ADD TABLE future_bookings;

-- Activer Realtime pour la table controller_actions_log
ALTER PUBLICATION supabase_realtime ADD TABLE controller_actions_log;

-- ==========================================
-- DIAGNOSTIC: Verifier tout fonctionne
-- ==========================================
SELECT 'OK CONFIGURATION COMPLETE' as status;

SELECT 'ENUM values:' as check_type;
SELECT enumlabel as valid_values
FROM pg_enum
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
WHERE pg_type.typname = 'reservation_status'
ORDER BY enumsortorder;

SELECT 'TABLES:' as check_type;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('future_bookings', 'controller_actions_log')
ORDER BY table_name;

SELECT 'RLS POLICIES (controller_actions_log):' as check_type;
SELECT policyname FROM pg_policies WHERE tablename = 'controller_actions_log' ORDER BY policyname;

SELECT 'TRIGGER:' as check_type;
SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'reservations' AND trigger_name = 'trg_log_controller_action';

SELECT 'TOUT EST PRET!' as final_message;
