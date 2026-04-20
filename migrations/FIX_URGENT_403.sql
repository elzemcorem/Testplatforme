-- 🚨 FIX URGENT - À EXÉCUTER MAINTENANT DANS SUPABASE
-- Ce fichier SUPPRIME les vieilles policies problématiques et en crée de bonnes
-- Durée: 5 secondes

-- ==========================================
-- ÉTAPE 1: Supprimer TOUTES les vieilles policies problématiques
-- ==========================================
DROP POLICY IF EXISTS "DAF can view all future bookings" ON future_bookings;
DROP POLICY IF EXISTS "Controllers can view future bookings" ON future_bookings;
DROP POLICY IF EXISTS "DAF can view all controller actions" ON controller_actions_log;
DROP POLICY IF EXISTS "Admin can view and manage actions" ON controller_actions_log;
DROP POLICY IF EXISTS "Controllers can update reservations" ON reservations;
DROP POLICY IF EXISTS "Admins can update reservations" ON reservations;

-- ==========================================
-- ÉTAPE 2: Créer les BONNES policies avec auth.jwt()
-- ==========================================

-- FUTURE_BOOKINGS
CREATE POLICY "DAF can view all future bookings" ON future_bookings
  FOR SELECT USING (auth.jwt()->>'email' = 'daf@beninpetro.com');

CREATE POLICY "Controllers can view future bookings" ON future_bookings
  FOR SELECT USING (auth.jwt()->>'role' = 'controller');

-- CONTROLLER_ACTIONS_LOG
CREATE POLICY "DAF can view all controller actions" ON controller_actions_log
  FOR SELECT USING (auth.jwt()->>'email' = 'daf@beninpetro.com');

CREATE POLICY "Admin can view and manage actions" ON controller_actions_log
  FOR SELECT USING (auth.jwt()->>'role' = 'admin');

-- RESERVATIONS
CREATE POLICY "Controllers can update reservations" ON reservations
  FOR UPDATE USING (auth.jwt()->>'role' = 'controller')
  WITH CHECK (auth.jwt()->>'role' = 'controller');

CREATE POLICY "Admins can update reservations" ON reservations
  FOR UPDATE USING (auth.jwt()->>'role' = 'admin')
  WITH CHECK (auth.jwt()->>'role' = 'admin');

-- ==========================================
-- ÉTAPE 3: Vérifier que les policies existent
-- ==========================================
SELECT '✅ VÉRIFICATION DES POLICIES' as status;
SELECT COUNT(*) as total_policies FROM pg_policies 
WHERE tablename IN ('future_bookings', 'controller_actions_log', 'reservations');

-- ==========================================
-- ÉTAPE 4: Afficher les policies créées
-- ==========================================
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('future_bookings', 'controller_actions_log', 'reservations')
ORDER BY tablename, policyname;

SELECT '✨ ERREUR 403 DEVRAIT ÊTRE RÉSOLUE!' as final_message;
