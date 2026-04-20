-- URGENT FIX: Check if RLS policies are blocking controller updates
-- Error: PGRST116 - Cannot coerce the result to a single JSON object
-- This means UPDATE returned 0 rows = RLS policy is blocking

-- STEP 1: Check if the RLS policies have been fixed
SELECT 'STEP 1: Current RLS Policies on future_bookings' as diagnostic;
SELECT 
  policyname,
  qual as "SELECT_CONDITION",
  with_check as "UPDATE_CONDITION"
FROM pg_policies 
WHERE tablename = 'future_bookings' AND schemaname = 'public'
ORDER BY policyname;

-- If the above shows old policies with "auth.jwt()", you need to run FIX_RLS_ROLE_CHECK.sql

-- STEP 2: Check if controller exists in allowed_users
SELECT 'STEP 2: Controller account info' as diagnostic;
SELECT email, role, noms FROM allowed_users WHERE role = 'controller' LIMIT 5;

-- STEP 3: Check a sample booking
SELECT 'STEP 3: Sample booking to test with' as diagnostic;
SELECT id, user_id, vehicle_id, status FROM future_bookings LIMIT 1;

-- STEP 4: Try to manually update as controller (this will fail if RLS policy is wrong)
-- IMPORTANT: Replace 'test@example.com' with your controller email
-- IMPORTANT: Replace 'booking-id' with an actual booking ID from STEP 3
SELECT 'STEP 4: Manual test - trying UPDATE as controller' as diagnostic;
-- This query shows the policy condition but doesn't execute the update
SELECT 
  'Policy Check' as test,
  EXISTS (
    SELECT 1 FROM allowed_users 
    WHERE allowed_users.email = 'controller@beninpetro.com'
    AND allowed_users.role = 'controller'
  ) as "Controller_exists_in_allowed_users",
  (SELECT COUNT(*) FROM future_bookings) as "Total_future_bookings";

-- STEP 5: Show what needs to be done
SELECT 'STEP 5: REQUIRED ACTION' as diagnostic;
SELECT '⚠️ If policies still show auth.jwt() condition, execute FIX_RLS_ROLE_CHECK.sql immediately' as action
UNION ALL
SELECT '✅ After executing FIX_RLS_ROLE_CHECK.sql, policies should use auth.email() to check allowed_users table'
UNION ALL
SELECT '🧪 Then test controller validation again in the UI'
UNION ALL
SELECT '💡 If error persists, make sure controller email is in allowed_users with role=controller';
