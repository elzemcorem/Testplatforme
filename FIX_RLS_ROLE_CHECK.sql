-- FIX: RLS Policies for future_bookings
-- Correction pour vérifier le rôle depuis la table allowed_users
-- La table allowed_users est l'autorité source pour les rôles
-- On utilise auth.email() pour faire le join avec allowed_users

-- Drop the old policies
DROP POLICY IF EXISTS "Only controllers can update future bookings" ON future_bookings;
DROP POLICY IF EXISTS "Controllers can view future bookings" ON future_bookings;
DROP POLICY IF EXISTS "Controllers can update reservations" ON reservations;
DROP POLICY IF EXISTS "Admins can update reservations" ON reservations;

-- Create new policies that check the role in the allowed_users table
-- Using auth.email() to join with allowed_users

CREATE POLICY "Only controllers can update future bookings" ON future_bookings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM allowed_users 
      WHERE allowed_users.email = auth.email() 
      AND allowed_users.role = 'controller'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM allowed_users 
      WHERE allowed_users.email = auth.email() 
      AND allowed_users.role = 'controller'
    )
  );

-- Also update the controllers view policy
CREATE POLICY "Controllers can view future bookings" ON future_bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM allowed_users 
      WHERE allowed_users.email = auth.email() 
      AND allowed_users.role = 'controller'
    )
  );

-- Update the reservations policies as well
CREATE POLICY "Controllers can update reservations" ON reservations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM allowed_users 
      WHERE allowed_users.email = auth.email() 
      AND allowed_users.role = 'controller'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM allowed_users 
      WHERE allowed_users.email = auth.email() 
      AND allowed_users.role = 'controller'
    )
  );

CREATE POLICY "Admins can update reservations" ON reservations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM allowed_users 
      WHERE allowed_users.email = auth.email() 
      AND allowed_users.role = 'admin'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM allowed_users 
      WHERE allowed_users.email = auth.email() 
      AND allowed_users.role = 'admin'
    )
  );

SELECT '✅ RLS Policies fixed to check role from allowed_users table' as status;

