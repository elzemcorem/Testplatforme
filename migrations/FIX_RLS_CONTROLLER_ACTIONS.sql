-- ⚡ QUICK FIX: Add RLS policy for controller_actions_log INSERT
-- This allows the trigger to log controller actions when status changes

-- STEP 1: Ensure the table has RLS enabled
ALTER TABLE controller_actions_log ENABLE ROW LEVEL SECURITY;

-- STEP 2: Drop existing policy if any (to avoid conflicts)
DROP POLICY IF EXISTS "Allow inserts for logging" ON controller_actions_log;

-- STEP 3: Create the INSERT policy that allows the trigger to log actions
CREATE POLICY "Allow inserts for logging" ON controller_actions_log
  FOR INSERT 
  WITH CHECK (true);

-- STEP 4: Verify the policy exists
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'controller_actions_log'
ORDER BY policyname;
