-- URGENT FIX: Restore Normal Reservations Functionality
-- The previous SQL only created controller/admin update policies
-- But removed the INSERT policy for normal users!
-- This prevents users from creating normal reservations

-- STEP 1: Drop broken policies on reservations
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Controllers can update reservations" ON reservations;
  DROP POLICY IF EXISTS "Admins can update reservations" ON reservations;
  DROP POLICY IF EXISTS "Users can read reservations" ON reservations;
  DROP POLICY IF EXISTS "Users can insert reservations" ON reservations;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- STEP 2: Create COMPLETE reservation policies

-- 1. Everyone can view all non-cancelled reservations
CREATE POLICY "Users can view all reservations" ON reservations
  FOR SELECT USING (status != 'cancelled');

-- 2. NORMAL USERS can create their own reservations
CREATE POLICY "Users can create reservations" ON reservations
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 3. Users can update their own pending reservations (e.g., to cancel)
CREATE POLICY "Users can update own reservations" ON reservations
  FOR UPDATE USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid());

-- 4. CONTROLLERS can update any reservation (to validate/reject)
CREATE POLICY "Controllers can update any reservation" ON reservations
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

-- 5. ADMINS can also update any reservation
CREATE POLICY "Admins can update any reservation" ON reservations
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

-- 6. Users can delete their own reservations
CREATE POLICY "Users can delete own reservations" ON reservations
  FOR DELETE USING (user_id = auth.uid() AND status = 'pending');

SELECT '✅ Reservation policies restored - Normal users can now create reservations!' as status;

-- Verification queries
SELECT 'VERIFICATION: Checking reservation policies' as check;
SELECT policyname, permissive, roles
FROM pg_policies 
WHERE tablename = 'reservations' AND schemaname = 'public'
ORDER BY policyname;
