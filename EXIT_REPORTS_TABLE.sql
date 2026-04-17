-- Table pour les rapports de sortie de véhicules
CREATE TABLE IF NOT EXISTS exit_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  vehicle_name TEXT NOT NULL,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  
  -- Informations de sortie
  departure_date TIMESTAMP NOT NULL,
  expected_return_date TIMESTAMP NOT NULL,
  
  -- État du véhicule à la sortie
  odometer_reading_start INT,
  fuel_level_start TEXT, -- 'empty', 'quarter', 'half', 'three_quarters', 'full'
  fuel_level_start_percent INT, -- Pourcentage (0-100)
  vehicle_condition TEXT, -- 'excellent', 'good', 'fair', 'poor'
  vehicle_condition_notes TEXT,
  
  -- Éléments véhicule
  items_checklist JSONB, -- [{name: string, status: 'ok'|'defect'|'damaged'}]
  
  -- Accessoires/équipement
  accessories JSONB, -- [{name: string, quantity: int, condition: string}]
  
  -- Carburant fourni
  fuel_provided_liters DECIMAL(10,2),
  fuel_type TEXT, -- 'diesel', 'essence', 'électrique'
  
  -- Signature et notes
  driver_signature_data TEXT, -- Signature numérique (base64)
  inspector_name TEXT,
  inspector_signature_data TEXT,
  global_notes TEXT,
  
  -- Métadonnées
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour les requêtes courantes
CREATE INDEX IF NOT EXISTS exit_reports_vehicle_id ON exit_reports(vehicle_id);
CREATE INDEX IF NOT EXISTS exit_reports_user_id ON exit_reports(user_id);
CREATE INDEX IF NOT EXISTS exit_reports_departure_date ON exit_reports(departure_date);
CREATE INDEX IF NOT EXISTS exit_reports_reservation_id ON exit_reports(reservation_id);

-- Politique RLS
ALTER TABLE exit_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "exit_reports_select_policy" ON exit_reports;
CREATE POLICY "exit_reports_select_policy"
ON exit_reports FOR SELECT
USING (true);

DROP POLICY IF EXISTS "exit_reports_insert_policy" ON exit_reports;
CREATE POLICY "exit_reports_insert_policy"
ON exit_reports FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "exit_reports_update_policy" ON exit_reports;
CREATE POLICY "exit_reports_update_policy"
ON exit_reports FOR UPDATE
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "exit_reports_delete_policy" ON exit_reports;
CREATE POLICY "exit_reports_delete_policy"
ON exit_reports FOR DELETE
USING (true);
