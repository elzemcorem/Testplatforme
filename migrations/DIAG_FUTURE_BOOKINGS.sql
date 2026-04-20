-- 🔍 DIAGNOSTIC: Vérifier si future_bookings existe et est bien configurée

-- 1️⃣ Vérifier si la table existe
SELECT '1️⃣ TABLE future_bookings' as check_name;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'future_bookings';

-- 2️⃣ Vérifier la structure si elle existe
SELECT '2️⃣ COLONNES de future_bookings' as check_name;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'future_bookings'
ORDER BY ordinal_position;

-- 3️⃣ Vérifier les RLS policies
SELECT '3️⃣ RLS POLICIES on future_bookings' as check_name;
SELECT policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'future_bookings'
ORDER BY policyname;

-- 4️⃣ Vérifier si RLS est activé
SELECT '4️⃣ RLS ENABLED on future_bookings' as check_name;
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'future_bookings';

-- 5️⃣ Compter les enregistrements
SELECT '5️⃣ NOMBRE de future_bookings' as check_name;
SELECT COUNT(*) as total_bookings FROM future_bookings;
