# 🔍 Rapport Diagnostic: auth.users - Triggers et RLS

**Généré:** 16/04/2026 23:23:23

## ⚠️ IMPORTANT: Accès Limité aux Métadonnées PostgreSQL

L'API Supabase n'expose pas directement les métadonnées PostgreSQL (triggers, RLS, contraintes) via le client JavaScript. Pour effectuer ce diagnostic complet, vous devez utiliser l'**SQL Editor** dans la console Supabase.

---

## 📋 ÉTAPES DU DIAGNOSTIC

### ÉTAPE 1: Accéder à la Console Supabase

1. Allez sur [https://app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet
3. Cliquez sur **SQL Editor** dans le menu latéral gauche
4. Créez une **nouvelle requête** ou copiez-collez les requêtes ci-dessous

---

## 🔍 REQUÊTE 1: Vérifier TOUS les TRIGGERS sur auth.users

```sql
-- Affiche tous les triggers sur auth.users
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth' 
  AND event_object_table = 'users'
ORDER BY trigger_name;
```

**Résultats attendus:**
- ✅ Aucun résultat = Pas de triggers
- ⚠️ 1+ résultat = Triggers trouvés (examinez l'action)

---

## 🔍 REQUÊTE 2: Vérifier les Politiques RLS

```sql
-- Affiche toutes les politiques RLS sur auth.users
SELECT 
  policyname,
  permissive,
  roles,
  qual as "using_clause",
  with_check
FROM pg_policies
WHERE schemaname = 'auth' 
  AND tablename = 'users';
```

**Résultats attendus:**
- ✅ Aucun résultat = Pas de RLS (ou RLS désactivé)
- ⚠️ 1+ résultat = Politiques RLS trouvées

---

## 🔍 REQUÊTE 3: Vérifier si RLS est ACTIVÉ

```sql
-- Affiche l'état de RLS sur la table
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'auth' 
  AND tablename = 'users';
```

**Résultats:**
- **rowsecurity = false** ✅ RLS est DÉSACTIVÉ (pas de restriction)
- **rowsecurity = true** ⚠️ RLS est ACTIVÉ (politiques applicables)

---

## 🔍 REQUÊTE 4: Lister les CONTRAINTES sur auth.users

```sql
-- Affiche toutes les contraintes
SELECT 
  constraint_name,
  constraint_type,
  column_name
FROM information_schema.constraint_column_usage
WHERE table_schema = 'auth' 
  AND table_name = 'users'
ORDER BY constraint_name;
```

---

## 🔍 REQUÊTE 5: Voir les COLONNES de auth.users

```sql
-- Affiche toutes les colonnes et leur configuration
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
```

---

## 🔍 REQUÊTE 6: Vérifier les PERMISSIONS/GRANTS

```sql
-- Affiche qui a accès à auth.users
SELECT 
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants
WHERE table_schema = 'auth' 
  AND table_name = 'users';
```

---

## 🔍 REQUÊTE 7: Voir les Triggers avec leurs FONCTIONS

```sql
-- Affiche les triggers ET les fonctions qu'ils exécutent
SELECT 
  t.trigger_name,
  t.event_manipulation,
  t.action_timing,
  p.proname as trigger_function,
  t.action_statement
FROM information_schema.triggers t
LEFT JOIN pg_trigger pt ON pt.tgname = t.trigger_name
LEFT JOIN pg_proc p ON pt.tgfoid = p.oid
WHERE t.event_object_schema = 'auth' 
  AND t.event_object_table = 'users'
ORDER BY t.trigger_name;
```

---

## 🔍 REQUÊTE 8: Chercher les FONCTIONS liées à auth.users

```sql
-- Affiche les fonctions personnalisées qui manipulent auth.users
SELECT 
  p.proname as function_name,
  n.nspname as schema_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'auth' 
  AND p.proname LIKE '%user%'
LIMIT 20;
```

---

## ⚠️ PROBLÈME COURANT: Erreur 500 au Signup des Users

**Signes:**
- ✅ Admin et Contrôleur peuvent se connecter
- ❌ Users reçoivent "500 Internal Server Error" au signup

**Causes possibles:**
1. **Trigger AFTER INSERT qui échoue**
   - Vérifie la REQUÊTE 1 et 7
   - Cherche les triggers qui pourraient bloquer ou lever une exception

2. **RLS trop restrictive**
   - Vérifie REQUÊTE 2 et 3
   - Si RLS = true ET il y a des politiques, elles pourraient bloquer les users

3. **Contrainte CHECK ou DEFAULT qui échoue**
   - Vérifie REQUÊTE 4 et 5
   - Cherche si une colonne a une valeur par défaut invalide

4. **Permissions insuffisantes**
   - Vérifie REQUÊTE 6
   - Cherche si le rôle 'anon' peut insérer dans auth.users

5. **Fonction personnalisée qui lève une exception**
   - Vérifie REQUÊTE 8
   - Cherche si une fonction levée une exception lors de la création

---

## 📋 CHECKLIST DE DÉBOGAGE

Après avoir exécuté les requêtes, vérifiez:

### ✅ Triggers
```
[ ] Pas de trigger - OK
[ ] Trigger(s) trouvé(s) - Vérifiez si c'est normal
    Trigger trouvé: ________________
    Action: ________________________
    Risque: [ ] Bloquant [ ] OK
```

### ✅ RLS Politiques
```
[ ] rowsecurity = false - OK (pas de RLS)
[ ] rowsecurity = true - Politique(s) trouvée(s)
    Politique: ______________________
    Rôles affectés: __________________
    Risque: [ ] Bloquant [ ] OK
```

### ✅ Contraintes
```
[ ] Aucune contrainte CHECK supplémentaire - OK
[ ] Contrainte CHECK trouvée - Vérifiez si elle bloque les users
    Contrainte: ______________________
```

### ✅ Permissions
```
[ ] Rôle 'anon' peut insérer - OK
[ ] Rôle 'anon' n'a pas de permissions - ⚠️ Problème
    Permissions pour 'anon': _________
```

---

## 🚀 ACTIONS RECOMMANDÉES

### Si Trigger trouvé + échoue:
```sql
-- Désactiver temporairement le trigger pour tester
ALTER TABLE auth.users DISABLE TRIGGER <nom_du_trigger>;

-- Réactiver après le test
ALTER TABLE auth.users ENABLE TRIGGER <nom_du_trigger>;
```

### Si RLS trop restrictive:
```sql
-- Vérifier la politique bloquante
SELECT * FROM pg_policies WHERE schemaname = 'auth' AND tablename = 'users';

-- Modifier ou supprimer la politique
DROP POLICY IF EXISTS <nom_politique> ON auth.users;
```

### Si contrainte CHECK problématique:
```sql
-- Voir les contraintes CHECK
SELECT constraint_name, check_clause
FROM information_schema.table_constraints
WHERE table_schema = 'auth' 
  AND table_name = 'users'
  AND constraint_type = 'CHECK';
```

---

## 📞 Support Supabase

Si vous ne trouvez pas le problème:
1. Consultez les **logs Supabase** (Logs → Edge Function Logs)
2. Vérifiez les **browser console logs** (F12 → Console)
3. Cherchez les erreurs PostgreSQL dans les requêtes

---

**Généré:** 16/04/2026 23:23:23
