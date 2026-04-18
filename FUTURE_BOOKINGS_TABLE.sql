-- Table pour les réservations planifiées (futures bookings)
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
  
  -- Index pour performances
  CONSTRAINT planned_dates_valid CHECK (planned_end_date > planned_start_date)
);

CREATE INDEX IF NOT EXISTS idx_future_bookings_user_id ON future_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_future_bookings_vehicle_id ON future_bookings(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_future_bookings_status ON future_bookings(status);
CREATE INDEX IF NOT EXISTS idx_future_bookings_planned_dates ON future_bookings(planned_start_date, planned_end_date);

-- Enable RLS
ALTER TABLE future_bookings ENABLE ROW LEVEL SECURITY;

-- Policy pour les utilisateurs normaux (voir leurs propres réservations planifiées)
DROP POLICY IF EXISTS "Users can view their own future bookings" ON future_bookings;
CREATE POLICY "Users can view their own future bookings" ON future_bookings
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create their own future bookings" ON future_bookings;
CREATE POLICY "Users can create their own future bookings" ON future_bookings
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own future bookings" ON future_bookings;
CREATE POLICY "Users can update their own future bookings" ON future_bookings
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Policy pour DAF (voir TOUTES les réservations planifiées)
DROP POLICY IF EXISTS "DAF can view all future bookings" ON future_bookings;
CREATE POLICY "DAF can view all future bookings" ON future_bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'daf@beninpetro.com'
    )
  );

-- Policy pour contrôleur (voir les réservations planifiées pertinentes)
DROP POLICY IF EXISTS "Controllers can view future bookings" ON future_bookings;
CREATE POLICY "Controllers can view future bookings" ON future_bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users WHERE id = auth.uid() AND role = 'controller'
    )
  );

-- Table pour tracker les actions du contrôleur (audit trail)
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

-- Policy pour DAF (voir TOUT)
DROP POLICY IF EXISTS "DAF can view all controller actions" ON controller_actions_log;
CREATE POLICY "DAF can view all controller actions" ON controller_actions_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'daf@beninpetro.com'
    )
  );

-- Policy pour contrôleur (voir ses propres actions)
DROP POLICY IF EXISTS "Controllers can view their own actions" ON controller_actions_log;
CREATE POLICY "Controllers can view their own actions" ON controller_actions_log
  FOR SELECT USING (controller_id = auth.uid());

-- Trigger pour enregistrer les actions du contrôleur automatiquement
CREATE OR REPLACE FUNCTION log_controller_action()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    INSERT INTO controller_actions_log (
      controller_id, 
      reservation_id, 
      action_type, 
      old_status, 
      new_status
    ) VALUES (
      auth.uid(),
      NEW.id,
      CASE 
        WHEN NEW.status = 'confirmed' THEN 'validated'
        WHEN NEW.status = 'cancelled' THEN 'cancelled'
        ELSE 'modified'
      END,
      OLD.status,
      NEW.status
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger si existe
DROP TRIGGER IF EXISTS trg_log_controller_action ON reservations;

-- Créer le trigger
CREATE TRIGGER trg_log_controller_action
AFTER UPDATE ON reservations
FOR EACH ROW
EXECUTE FUNCTION log_controller_action();
