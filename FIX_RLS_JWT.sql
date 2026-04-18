-- 🔧 FIX RAPIDE: RLS Policies utilisant auth.jwt() au lieu de auth.users
-- À exécuter IMMÉDIATEMENT dans Supabase pour fixer l'erreur 403
-- Durée: ~5 secondes

-- ==========================================
-- FIX 1: future_bookings policies
-- ==========================================
-- DAF policy (utilise auth.jwt() pour accéder à l'email)
DROP POLICY IF EXISTS "DAF can view all future bookings" ON future_bookings;
CREATE POLICY "DAF can view all future bookings" ON future_bookings
  FOR SELECT USING (
    auth.jwt()->>'email' = 'daf@beninpetro.com'
  );

-- Controller policy (utilise auth.jwt() pour accéder au role)
DROP POLICY IF EXISTS "Controllers can view future bookings" ON future_bookings;
CREATE POLICY "Controllers can view future bookings" ON future_bookings
  FOR SELECT USING (
    auth.jwt()->>'role' = 'controller'
  );

-- ==========================================
-- FIX 2: controller_actions_log policies
-- ==========================================
-- DAF policy
DROP POLICY IF EXISTS "DAF can view all controller actions" ON controller_actions_log;
CREATE POLICY "DAF can view all controller actions" ON controller_actions_log
  FOR SELECT USING (
    auth.jwt()->>'email' = 'daf@beninpetro.com'
  );

-- Admin policy
DROP POLICY IF EXISTS "Admin can view and manage actions" ON controller_actions_log;
CREATE POLICY "Admin can view and manage actions" ON controller_actions_log
  FOR SELECT USING (
    auth.jwt()->>'role' = 'admin'
  );

-- ==========================================
-- FIX 3: reservations policies
-- ==========================================
-- Controllers can update
DROP POLICY IF EXISTS "Controllers can update reservations" ON reservations;
CREATE POLICY "Controllers can update reservations" ON reservations
  FOR UPDATE USING (
    auth.jwt()->>'role' = 'controller'
  )
  WITH CHECK (
    auth.jwt()->>'role' = 'controller'
  );

-- Admins can update
DROP POLICY IF EXISTS "Admins can update reservations" ON reservations;
CREATE POLICY "Admins can update reservations" ON reservations
  FOR UPDATE USING (
    auth.jwt()->>'role' = 'admin'
  )
  WITH CHECK (
    auth.jwt()->>'role' = 'admin'
  );

-- ==========================================
-- VÉRIFICATION
-- ==========================================
SELECT '✅ POLICIES CORRIGÉES' as status;
SELECT policyname FROM pg_policies WHERE tablename IN ('future_bookings', 'controller_actions_log', 'reservations') ORDER BY tablename, policyname;
SELECT '✨ Erreur 403 devrait être résolue!' as message;
