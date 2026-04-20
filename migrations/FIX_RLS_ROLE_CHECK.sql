-- FIX: RLS Policies for future_bookings
-- Correction pour vérifier le rôle depuis la table allowed_users
-- La table allowed_users est l'autorité source pour les rôles
-- On utilise auth.email() pour faire le join avec allowed_users

-- STEP 1: DROP ALL OLD POLICIES FIRST
-- This ensures we're starting fresh with no conflicting policies
DO $$ 
BEGIN
  -- Drop from future_bookings
  DROP POLICY IF EXISTS "Only controllers can update future bookings" ON future_bookings;
  DROP POLICY IF EXISTS "Controllers can view future bookings" ON future_bookings;
  DROP POLICY IF EXISTS "Everyone can view all future bookings" ON future_bookings;
  DROP POLICY IF EXISTS "Users can create their own future bookings" ON future_bookings;
  DROP POLICY IF EXISTS "Users can delete their own future bookings" ON future_bookings;
  
  -- Drop from reservations
  DROP POLICY IF EXISTS "Controllers can update reservations" ON reservations;
  DROP POLICY IF EXISTS "Admins can update reservations" ON reservations;
  
  RAISE NOTICE 'All old policies dropped successfully';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error dropping policies (may already be gone): %', SQLERRM;
END $$;

-- STEP 2: CREATE NEW POLICIES
-- Everyone can view all non-cancelled future bookings
CREATE POLICY "Everyone can view all future bookings" ON future_bookings
  FOR SELECT USING (status != 'cancelled');

-- Users can create their own future bookings
CREATE POLICY "Users can create their own future bookings" ON future_bookings
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can delete their own future bookings
CREATE POLICY "Users can delete their own future bookings" ON future_bookings
  FOR DELETE USING (user_id = auth.uid());

-- ONLY CONTROLLERS CAN UPDATE - THIS IS THE KEY POLICY
-- Check role from allowed_users table using auth.email()
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

-- STEP 3: Fix reservations policies as well
-- Only controllers can update reservations
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

-- Only admins can also update reservations
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

-- STEP 4: VERIFICATION
SELECT '✅ RLS Policies successfully configured' as status;
SELECT '⚠️ IMPORTANT: These policies NOW require FIX_RLS_ROLE_CHECK.sql to be run' as warning;
SELECT 'If controllers still cannot update, verify:' as note;
SELECT '  1. Execute UPDATE allowed_users SET role = ''controller'' WHERE email = your_email;' as step1;
SELECT '  2. Refresh browser (F5)' as step2;
SELECT '  3. Test again' as step3;

