-- 🔍 DIAGNOSTIC COMPLET: Vérifier que le flux Controller → DAF fonctionne

-- ========================================
-- 1️⃣ Vérifier que l'ENUM a la valeur "confirmed"
-- ========================================
SELECT '1️⃣ ENUM reservation_status' as diagnostic;
SELECT enumlabel as valid_values
FROM pg_enum
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
WHERE pg_type.typname = 'reservation_status'
ORDER BY enumsortorder;

-- ========================================
-- 2️⃣ Vérifier les TABLES existent
-- ========================================
SELECT '2️⃣ TABLES' as diagnostic;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('reservations', 'controller_actions_log', 'future_bookings')
ORDER BY table_name;

-- ========================================
-- 3️⃣ Vérifier les RLS POLICIES existent
-- ========================================
SELECT '3️⃣ RLS POLICIES - controller_actions_log' as diagnostic;
SELECT policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'controller_actions_log'
ORDER BY policyname;

-- ========================================
-- 4️⃣ Vérifier la RLS Policy pour contrôleur UPDATE
-- ========================================
SELECT '4️⃣ RLS POLICIES - reservations (controllers)' as diagnostic;
SELECT policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'reservations' 
AND policyname ILIKE '%controller%'
ORDER BY policyname;

-- ========================================
-- 5️⃣ Vérifier le TRIGGER existe
-- ========================================
SELECT '5️⃣ TRIGGER' as diagnostic;
SELECT trigger_name, event_manipulation, event_object_table, action_timing, action_orientation
FROM information_schema.triggers
WHERE event_object_table = 'reservations'
AND trigger_name = 'trg_log_controller_action';

-- ========================================
-- 6️⃣ Vérifier la FONCTION du trigger
-- ========================================
SELECT '6️⃣ TRIGGER FUNCTION' as diagnostic;
SELECT routine_name, routine_type, data_type
FROM information_schema.routines
WHERE routine_name = 'log_controller_action'
AND routine_schema = 'public';

-- ========================================
-- 7️⃣ Compter les actions loggées
-- ========================================
SELECT '7️⃣ Controller Actions Log (dernières)' as diagnostic;
SELECT id, controller_id, action_type, old_status, new_status, timestamp
FROM controller_actions_log
ORDER BY timestamp DESC
LIMIT 5;

-- ========================================
-- 8️⃣ Vérifier les réservations avec contrôleur
-- ========================================
SELECT '8️⃣ RESERVATIONS (dernières validées)' as diagnostic;
SELECT id, status, validated_by, updated_at
FROM reservations
WHERE status = 'confirmed' OR validated_by IS NOT NULL
ORDER BY updated_at DESC
LIMIT 5;

-- ========================================
-- 9️⃣ Test: Vérifier un utilisateur contrôleur existe
-- ========================================
SELECT '9️⃣ AUTH USERS - Controller role' as diagnostic;
SELECT id, email, role
FROM auth.users
WHERE role = 'controller'
LIMIT 5;

-- ========================================
-- 🔟 Test: Simuler une validation
-- ========================================
SELECT '🔟 TEST FLOW - Prêt' as diagnostic;
SELECT 'Pour tester:' as instruction,
  '1. Connectez-vous comme contrôleur' as step_1,
  '2. Validez une réservation' as step_2,
  '3. Vérifiez la console pour les logs' as step_3,
  '4. Connectez-vous comme DAF' as step_4,
  '5. Allez au Dashboard DAF' as step_5,
  '6. Vérifiez que l''action apparaît' as step_6;
