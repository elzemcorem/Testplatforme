-- DIAGNOSTIC: Vérifier les permissions DAF et les RLS policies

SELECT 'VERIFYING DAF SETUP' as section;

-- 1. Vérifier que DAF existe dans allowed_users
SELECT 'Step 1: Check DAF in allowed_users' as check_type;
SELECT id, noms, email, role FROM allowed_users WHERE email = 'daf@beninpetro.com';

-- 2. Vérifier les RLS policies sur future_bookings
SELECT 'Step 2: RLS Policies on future_bookings' as check_type;
SELECT schemaname, tablename, policyname, permissive, roles, qual 
FROM pg_policies 
WHERE tablename = 'future_bookings'
ORDER BY policyname;

-- 3. Vérifier les RLS policies sur controller_actions_log
SELECT 'Step 3: RLS Policies on controller_actions_log' as check_type;
SELECT schemaname, tablename, policyname, permissive, roles, qual 
FROM pg_policies 
WHERE tablename = 'controller_actions_log'
ORDER BY policyname;

-- 4. Vérifier que les tables existent
SELECT 'Step 4: Check tables exist' as check_type;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('future_bookings', 'controller_actions_log', 'allowed_users', 'reservations')
ORDER BY table_name;

-- 5. Vérifier le statut RLS
SELECT 'Step 5: Check RLS enabled' as check_type;
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('future_bookings', 'controller_actions_log', 'allowed_users')
ORDER BY tablename;

-- 6. Vérifier la publication Realtime
SELECT 'Step 6: Check Realtime publication' as check_type;
SELECT pubname FROM pg_publication WHERE pubname = 'supabase_realtime';

-- 7. Vérifier les tables dans la publication Realtime
SELECT 'Step 7: Tables in supabase_realtime publication' as check_type;
SELECT 
  n.nspname as schema_name,
  r.relname as table_name
FROM pg_publication p
JOIN pg_publication_rel pr ON p.oid = pr.prrelid
JOIN pg_class r ON pr.relid = r.oid
JOIN pg_namespace n ON r.relnamespace = n.oid
WHERE p.pubname = 'supabase_realtime'
ORDER BY table_name;

SELECT 'DIAGNOSTIC COMPLETE' as final_message;
