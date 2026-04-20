-- Diagnostic: Verify Controller Access and Permissions
-- Run this to verify the controller can update future bookings

-- Step 1: List all controllers in the system
SELECT 'Step 1: Controllers in allowed_users' as step;
SELECT email, role, noms, id FROM allowed_users WHERE role = 'controller';

-- Step 2: Check RLS policies for future_bookings
SELECT 'Step 2: RLS Policies on future_bookings' as step;
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'future_bookings'
ORDER BY policyname;

-- Step 3: Check RLS policies for reservations
SELECT 'Step 3: RLS Policies on reservations' as step;
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'reservations'
ORDER BY policyname;

-- Step 4: Check tables are in realtime publication
SELECT 'Step 4: Realtime tables' as step;
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- Step 5: List all future bookings (by status)
SELECT 'Step 5: Future bookings status distribution' as step;
SELECT 
  status,
  COUNT(*) as count,
  MAX(updated_at) as last_updated
FROM future_bookings
GROUP BY status
ORDER BY status;

-- Step 6: Show first 5 future bookings for testing
SELECT 'Step 6: Sample future bookings (first 5)' as step;
SELECT 
  id,
  user_id,
  vehicle_id,
  status,
  planned_start_date,
  planned_end_date,
  created_at,
  updated_at
FROM future_bookings
LIMIT 5;

-- Step 7: Verify auth.email() function works
SELECT 'Step 7: Current authenticated user info' as step;
SELECT auth.uid() as user_uid, auth.email() as user_email, auth.role() as auth_role;

-- Step 8: Manual permission test - list what the current user can do
SELECT 'Step 8: Policy evaluation for current user' as step;
SELECT 
  'Can INSERT' as action,
  COUNT(*) as allowed
FROM future_bookings
WHERE auth.uid() IS NOT NULL
LIMIT 1;

-- Step 9: Show trigger and function info
SELECT 'Step 9: Trigger and function info' as step;
SELECT 
  t.trigger_schema,
  t.trigger_name,
  t.event_manipulation,
  t.event_object_table,
  t.action_timing,
  t.action_statement
FROM information_schema.triggers t
WHERE t.event_object_table IN ('future_bookings', 'controller_actions_log')
ORDER BY t.event_object_table, t.trigger_name;
