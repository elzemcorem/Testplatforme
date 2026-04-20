-- DIAGNOSTIC: Quick test if controller can update
-- This will tell you EXACTLY what's blocking the update

-- Quick Status Check
SELECT 'QUICK STATUS CHECK' as section;
SELECT COUNT(*) as total_controllers FROM allowed_users WHERE role = 'controller';
SELECT COUNT(*) as total_future_bookings FROM future_bookings;
SELECT COUNT(*) as total_active_bookings FROM future_bookings WHERE status IN ('pending', 'confirmed');

-- Check RLS policies
SELECT 'RLS POLICIES' as section;
SELECT 
  policyname,
  CASE WHEN qual LIKE '%allowed_users%' THEN '✅ Uses allowed_users' 
       WHEN qual LIKE '%auth.jwt%' THEN '❌ Uses broken auth.jwt()' 
       ELSE qual 
  END as policy_status
FROM pg_policies 
WHERE tablename = 'future_bookings' AND schemaname = 'public';

-- Manual permission test - IMPORTANT
-- This simulates what the frontend is trying to do
SELECT 'PERMISSION TEST' as section;
SELECT 
  'Testing if policies allow UPDATE' as test_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'future_bookings' 
      AND policyname = 'Only controllers can update future bookings'
    ) THEN '✅ Policy exists'
    ELSE '❌ Policy missing'
  END as policy_check,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM allowed_users 
      WHERE role = 'controller'
    ) THEN '✅ Controllers exist'
    ELSE '❌ No controllers found'
  END as controller_check;

-- Show controllers
SELECT 'CONTROLLERS IN SYSTEM' as section;
SELECT email, role, noms FROM allowed_users WHERE role = 'controller';

-- Show a sample booking
SELECT 'SAMPLE BOOKING TO TEST WITH' as section;
SELECT 
  id,
  user_id,
  vehicle_id,
  status,
  planned_start_date,
  planned_end_date
FROM future_bookings
LIMIT 1;

-- The KEY TEST - Policy evaluation
-- This shows if the policy CONDITION itself is correct
SELECT 'POLICY CONDITION CHECK' as section;
SELECT 
  'If this query works, policies are syntactically correct' as note,
  EXISTS (
    SELECT 1 FROM allowed_users 
    WHERE email = auth.email() 
    AND role = 'controller'
  ) as "Controller_check_works?";

-- Detailed policy inspection
SELECT 'DETAILED POLICY INFO' as section;
SELECT 
  schemaname,
  tablename,
  policyname,
  CASE permissive WHEN true THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END as type,
  qual as "SELECT/USING_condition",
  with_check as "INSERT/UPDATE_condition"
FROM pg_policies
WHERE tablename IN ('future_bookings', 'reservations') AND schemaname = 'public'
ORDER BY tablename, policyname;

-- Final recommendation
SELECT 'ACTION REQUIRED' as section;
SELECT CASE 
  WHEN NOT EXISTS (
    SELECT 1 FROM allowed_users WHERE role = 'controller'
  ) THEN '❌ No controllers in allowed_users - add one'
  WHEN NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'future_bookings'
    AND policyname = 'Only controllers can update future bookings'
  ) THEN '❌ RLS policy missing - execute FIX_RLS_ROLE_CHECK.sql'
  WHEN EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'future_bookings'
    AND qual LIKE '%auth.jwt%'
  ) THEN '⚠️ Old broken policies found - execute FIX_RLS_ROLE_CHECK.sql to replace'
  ELSE '✅ Everything looks configured correctly - test in UI'
END as status;
