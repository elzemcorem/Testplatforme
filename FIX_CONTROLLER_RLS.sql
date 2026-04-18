-- FIX: Permettre au contrôleur de mettre à jour les réservations
-- Le contrôleur a besoin de pouvoir valider/annuler les réservations

-- Ajouter une policy pour que les contrôleurs puissent UPDATE les réservations
DROP POLICY IF EXISTS "Controllers can update reservations" ON reservations;
CREATE POLICY "Controllers can update reservations" ON reservations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users WHERE id = auth.uid() AND role = 'controller'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users WHERE id = auth.uid() AND role = 'controller'
    )
  );

-- Permettre aussi aux admins de mettre à jour
DROP POLICY IF EXISTS "Admins can update reservations" ON reservations;
CREATE POLICY "Admins can update reservations" ON reservations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Permettre aux utilisateurs de créer des réservations pour eux-mêmes
DROP POLICY IF EXISTS "Users can create reservations" ON reservations;
CREATE POLICY "Users can create reservations" ON reservations
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Permettre aux utilisateurs de voir leurs propres réservations
DROP POLICY IF EXISTS "Users can view their own reservations" ON reservations;
CREATE POLICY "Users can view their own reservations" ON reservations
  FOR SELECT USING (user_id = auth.uid());

-- Permettre aux contrôleurs de voir toutes les réservations
DROP POLICY IF EXISTS "Controllers can view all reservations" ON reservations;
CREATE POLICY "Controllers can view all reservations" ON reservations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users WHERE id = auth.uid() AND role = 'controller'
    )
  );

-- Permettre aux admins de voir toutes les réservations
DROP POLICY IF EXISTS "Admins can view all reservations" ON reservations;
CREATE POLICY "Admins can view all reservations" ON reservations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Debug: Afficher toutes les policies actuelles
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'reservations'
ORDER BY policyname;
