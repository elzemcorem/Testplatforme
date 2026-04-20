# 🚨 RÉSUMÉ D'URGENCE: Diagnostic auth.users

**Date:** 16/04/2026  
**Problème:** Users obtiennent "500 Internal Server Error" au signup, mais admin/contrôleur fonctionnent

---

## ⚡ ACTION IMMÉDIATE (5 minutes)

### 1️⃣ Vérifier les Triggers

Allez dans **Supabase Console → SQL Editor** et exécutez:

```sql
SELECT trigger_name, event_manipulation, action_timing, action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth' AND event_object_table = 'users'
ORDER BY trigger_name;
```

**Résultats:**
- ✅ Aucun résultat = Pas de triggers (continuez)
- ❌ Trigger(s) trouvé(s) = Vérifiez l'action


### 2️⃣ Vérifier RLS

```sql
-- Vérifier l'état de RLS
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'auth' AND tablename = 'users';

-- Vérifier les politiques
SELECT policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'auth' AND tablename = 'users';
```

**Résultats:**
- ✅ `rowsecurity = false` = OK (RLS inactif)
- ❌ `rowsecurity = true` + politiques = Problème potentiel


### 3️⃣ Vérifier les Contraintes CHECK

```sql
SELECT constraint_name, check_clause
FROM information_schema.table_constraints
WHERE table_schema = 'auth' 
  AND table_name = 'users'
  AND constraint_type = 'CHECK';
```

**Résultats:**
- ✅ Aucun résultat = OK
- ❌ Contrainte trouvée = Vérifiez si elle bloque


---

## 📋 CONTEXTE DE VOTRE PROBLÈME

Vous avez mentionné:
- ✅ Admin et Contrôleur peuvent se connecter
- ✅ Vous venez de créer un trigger AFTER INSERT pour confirmer les emails
- ❌ Users échouent avec "500 Internal Server Error"

**Cause probable:** Le trigger AFTER INSERT que vous avez créé lève une exception pour les users!

---

## 🔍 VÉRIFICATIONS DÉTAILLÉES (par ordre de probabilité)

### 1. Trigger AFTER INSERT (TRÈS PROBABLE)

Vérifiez le trigger que vous avez créé:

```sql
-- Voir le trigger et sa fonction
SELECT 
  t.trigger_name,
  t.event_manipulation,
  t.action_timing,
  p.proname as function_name,
  t.action_statement
FROM information_schema.triggers t
LEFT JOIN pg_trigger pt ON pt.tgname = t.trigger_name
LEFT JOIN pg_proc p ON pt.tgfoid = p.oid
WHERE t.event_object_schema = 'auth' 
  AND t.event_object_table = 'users'
ORDER BY t.trigger_name;
```

**Si trigger trouvé:**
- Vérifiez si la fonction a une condition `RAISE EXCEPTION` basée sur un rôle
- Cherchez si elle valide quelque chose qui échoue pour les users


### 2. RLS sur auth.users (PROBABLE)

```sql
SELECT rowsecurity FROM pg_tables
WHERE schemaname = 'auth' AND tablename = 'users';
```

Si `rowsecurity = true`:
```sql
-- Voir les politiques bloquantes
SELECT * FROM pg_policies
WHERE schemaname = 'auth' AND tablename = 'users';
```

**Si politiques trouvées:**
- Une politique RESTRICTIVE pourrait bloquer les insertions
- Une politique PERMISSIVE insufficient pourrait bloquer les users


### 3. Permissions du Rôle 'anon' (MOINS PROBABLE)

```sql
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'auth' AND table_name = 'users'
AND grantee = 'anon';
```

**Si pas de permission INSERT:**
- Ajouter: `GRANT INSERT ON auth.users TO anon;`


---

## 🚀 SOLUTIONS RAPIDES

### Solution 1: Vérifier le Trigger

Si le trigger lève une exception pour les users:

```sql
-- Voir la définition complète du trigger
SELECT pg_get_triggerdef(oid)
FROM pg_trigger
WHERE tgname = '<NOM_DU_TRIGGER>';

-- Désactiver temporairement pour tester
ALTER TABLE auth.users DISABLE TRIGGER <NOM_DU_TRIGGER>;

-- Réactiver après test
ALTER TABLE auth.users ENABLE TRIGGER <NOM_DU_TRIGGER>;
```


### Solution 2: Vérifier/Modifier RLS

```sql
-- Voir l'état de RLS
ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;

-- Si RLS est le problème, désactiver pour tester
-- Réactiver après confirmation:
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
```


### Solution 3: Voir les Logs Supabase

1. Allez sur **Supabase Console**
2. Cliquez sur **Logs** dans le menu
3. Cherchez "auth.users" ou "signup" dans les logs
4. Vérifiez les erreurs PostgreSQL


---

## 📊 FICHIERS CRÉÉS

1. **AUTH_USERS_DIAGNOSTIC_REPORT.md**
   - Rapport complet avec 8 requêtes SQL détaillées
   - Checklist de débogage
   - Actions recommandées

2. **SQL_DIAGNOSTIC_AUTH_USERS.sql**
   - Toutes les requêtes SQL prêtes à copier-coller
   - Commentaires explicatifs

3. **TRIGGER_DETAILS.md** (ce fichier)
   - Résumé d'urgence
   - Actions immédiates
   - Solutions rapides


---

## 💡 HYPOTHÈSE LA PLUS PROBABLE

Votre trigger AFTER INSERT pour la confirmation d'email fait probablement:

```sql
CREATE OR REPLACE FUNCTION confirm_user_email()
RETURNS TRIGGER AS $$
BEGIN
  -- ❌ PROBABLE: Exception pour les users
  IF NEW.role = 'user' THEN
    RAISE EXCEPTION 'Users not allowed to signup';
  END IF;
  
  -- Code pour confirmer l'email...
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Solution:**
- Modifier le trigger pour NE PAS lever une exception
- Ou utiliser une approche différente (custom claims, webhook)


---

## 📞 BESOIN D'AIDE?

1. Exécutez les 3 requêtes d'urgence ci-dessus
2. Notez les résultats
3. Consultez les logs Supabase
4. Désactivez le trigger pour tester
5. Vérifiez l'erreur réelle (F12 → Console)


**Prochaine étape:** Une fois que vous avez les résultats, partagez-les pour une analyse détaillée!
