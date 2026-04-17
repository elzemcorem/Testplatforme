-- ============================================================================
-- DIAGNOSTIC COMPLET: auth.users - Triggers, RLS, et Contraintes
-- ============================================================================
-- Exécutez ces requêtes une par une dans l'éditeur SQL de Supabase

-- REQUÊTE 1: Tous les TRIGGERS sur auth.users
-- ============================================================================
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  event_object_schema,
  event_object_table,
  action_statement,
  action_orientation
FROM information_schema.triggers
WHERE event_object_schema = 'auth' 
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- REQUÊTE 2: Détails des fonctions appelées par les triggers
-- ============================================================================
SELECT 
  p.proname as function_name,
  n.nspname as schema_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname IN (
  SELECT routine_name
  FROM information_schema.routines
  WHERE routine_schema = 'auth' 
    AND routine_name LIKE '%user%'
);

-- REQUÊTE 3: Politiques RLS (Row Level Security) sur auth.users
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual as "using_clause",
  with_check
FROM pg_policies
WHERE schemaname = 'auth' 
  AND tablename = 'users';

-- REQUÊTE 4: Vérifier si RLS est activé sur la table
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'auth' 
  AND tablename = 'users';

-- REQUÊTE 5: Toutes les contraintes sur auth.users
-- ============================================================================
SELECT 
  con.conname as constraint_name,
  con.contype as constraint_type,
  a.attname as column_name
FROM pg_constraint con
JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = ANY(con.conkey)
JOIN pg_class c ON c.oid = con.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'auth' 
  AND c.relname = 'users'
ORDER BY con.conname, a.attnum;

-- REQUÊTE 6: Tous les INDEX sur auth.users
-- ============================================================================
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'auth' 
  AND tablename = 'users'
ORDER BY indexname;

-- REQUÊTE 7: Colonnes de la table auth.users
-- ============================================================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  is_identity
FROM information_schema.columns
WHERE table_schema = 'auth' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- REQUÊTE 8: Vérifier les GRANT/PERMISSIONS sur la table
-- ============================================================================
SELECT 
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants
WHERE table_schema = 'auth' 
  AND table_name = 'users'
ORDER BY grantee, privilege_type;

-- REQUÊTE 9: Les triggers spécifiques avec leurs noms de fonction
-- ============================================================================
SELECT 
  t.trigger_name,
  t.event_manipulation,
  t.action_timing,
  t.action_orientation,
  p.proname as trigger_function,
  ns.nspname as function_schema
FROM information_schema.triggers t
LEFT JOIN pg_trigger pt ON pt.tgname = t.trigger_name
LEFT JOIN pg_proc p ON pt.tgfoid = p.oid
LEFT JOIN pg_namespace ns ON p.pronamespace = ns.oid
WHERE t.event_object_schema = 'auth' 
  AND t.event_object_table = 'users'
ORDER BY t.trigger_name;

-- REQUÊTE 10: Les tables qui référencent auth.users (Foreign Keys)
-- ============================================================================
SELECT 
  constraint_name,
  table_schema,
  table_name,
  column_name,
  referenced_table_name,
  referenced_column_name
FROM information_schema.referential_constraints rc
JOIN information_schema.constraint_column_usage ccu 
  ON rc.constraint_name = ccu.constraint_name 
  AND rc.table_schema = ccu.table_schema
WHERE rc.referenced_table_schema = 'auth' 
  AND rc.referenced_table_name = 'users'
ORDER BY constraint_name;
