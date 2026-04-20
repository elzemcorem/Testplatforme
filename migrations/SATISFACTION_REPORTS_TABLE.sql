-- SUPPRIMER LA TABLE SI ELLE EXISTE DÉJÀ (pour recréer avec les bonnes colonnes)
DROP TABLE IF EXISTS satisfaction_reports CASCADE;

-- Table pour les rapports de satisfaction de services
CREATE TABLE satisfaction_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exit_report_id UUID REFERENCES exit_reports(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Services avec leurs données
  dcm_requests INT DEFAULT 0,
  dcm_satisfied INT DEFAULT 0,
  dcm_unsatisfied INT DEFAULT 0,
  
  dtm_requests INT DEFAULT 0,
  dtm_satisfied INT DEFAULT 0,
  dtm_unsatisfied INT DEFAULT 0,
  
  daf_requests INT DEFAULT 0,
  daf_satisfied INT DEFAULT 0,
  daf_unsatisfied INT DEFAULT 0,
  
  qhse_requests INT DEFAULT 0,
  qhse_satisfied INT DEFAULT 0,
  qhse_unsatisfied INT DEFAULT 0,
  
  do_requests INT DEFAULT 0,
  do_satisfied INT DEFAULT 0,
  do_unsatisfied INT DEFAULT 0,
  
  -- Métadonnées
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index
CREATE INDEX satisfaction_reports_exit_report_id ON satisfaction_reports(exit_report_id);
CREATE INDEX satisfaction_reports_vehicle_id ON satisfaction_reports(vehicle_id);
CREATE INDEX satisfaction_reports_user_id ON satisfaction_reports(user_id);

-- RLS
ALTER TABLE satisfaction_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "satisfaction_reports_all"
ON satisfaction_reports FOR ALL
USING (true)
WITH CHECK (true);
