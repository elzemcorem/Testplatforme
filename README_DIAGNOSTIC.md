# 🔍 INDEX: Diagnostic Complet auth.users

**Status:** ✅ Tous les outils de diagnostic prêts  
**Objectif:** Identifier les triggers et RLS bloquant les users au signup  
**Temps estimé:** 5-15 minutes

---

## 📚 DOCUMENTATION CRÉÉE

### 1. **SYNTHESE_COMPLETE.md** ⭐ LIRE EN PREMIER
- **Durée:** 5-10 minutes
- **Contenu:**
  - Vue d'ensemble du problème
  - 5 étapes pour vérifier les triggers et RLS
  - Tableau de diagnostic
  - Solutions par scénario
  - Hypothèse la plus probable (trigger trop restrictif)

📌 **À faire:** Lire ce fichier en premier, puis exécuter les requêtes SQL


### 2. **AUTH_USERS_DIAGNOSTIC_REPORT.md** 📋 RÉFÉRENCE COMPLET
- **Durée:** 15-20 minutes
- **Contenu:**
  - 8 requêtes SQL complètes et commentées
  - Résultats attendus pour chaque requête
  - Checklist de débogage détaillée
  - Causes possibles de l'erreur 500
  - Actions recommandées
  - Guides pour désactiver/modifier triggers et RLS

📌 **À faire:** Consulter si les résultats ne sont pas clairs


### 3. **TRIGGER_DETAILS.md** ⚡ ACTIONS IMMÉDIATES
- **Durée:** 5 minutes
- **Contenu:**
  - Résumé d'urgence du problème
  - 3 requêtes SQL prioritaires
  - Hypothèse probable (trigger AFTER INSERT)
  - Solutions rapides
  - Où vérifier les logs

📌 **À faire:** Consulter si vous êtes pressé


### 4. **SQL_DIAGNOSTIC_AUTH_USERS.sql** 💾 REQUÊTES SQL
- **Durée:** À copier-coller dans Supabase
- **Contenu:**
  - 10 requêtes SQL prêtes à copier-coller
  - Commentaires explicatifs pour chaque requête
  - Pas d'adaptation nécessaire
  - Exécutez une par une ou d'autres groupées

📌 **À faire:** Copier chaque requête et l'exécuter dans Supabase SQL Editor


### 5. **SYNTHESE_COMPLETE.md** (ce fichier)
- **Index de navigation**
- **Commandes rapides**
- **Flux de diagnostic**

📌 **À faire:** Référence rapide pour naviguer les fichiers

---

## ⚡ FLUX DE DIAGNOSTIC RAPIDE

### OPTION A: Je suis pressé (5 minutes)

1. 📖 Lire: **TRIGGER_DETAILS.md** (résumé)
2. 🔍 Exécuter: Les 3 requêtes prioritaires
3. ✅ Résoudre: Selon les résultats

### OPTION B: Je veux une vue complète (15 minutes)

1. 📖 Lire: **SYNTHESE_COMPLETE.md** (vue d'ensemble)
2. 🔍 Exécuter: Les 5 étapes de vérification
3. 📋 Consulter: **AUTH_USERS_DIAGNOSTIC_REPORT.md** au besoin
4. ✅ Résoudre: Selon le scénario

### OPTION C: Je veux tout vérifier (30 minutes)

1. 📖 Lire: **SYNTHESE_COMPLETE.md** + **AUTH_USERS_DIAGNOSTIC_REPORT.md**
2. 🔍 Exécuter: Toutes les requêtes du fichier **SQL_DIAGNOSTIC_AUTH_USERS.sql**
3. 📊 Analyser: Les résultats avec la checklist
4. ✅ Résoudre: Selon chaque résultat

---

## 🚀 REQUÊTES SQL ESSENTIELLES

### Requête #1: Vérifier les Triggers

```sql
SELECT trigger_name, event_manipulation, action_timing, action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth' AND event_object_table = 'users';
```

**Résultat attendu:**
- ✅ Vide = Pas de triggers
- ❌ Résultats = Triggers trouvés (à analyser)


### Requête #2: Vérifier l'état de RLS

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'auth' AND tablename = 'users';
```

**Résultat attendu:**
- ✅ `rowsecurity = false` = RLS désactivé
- ❌ `rowsecurity = true` = RLS activé (à vérifier)


### Requête #3: Vérifier les Politiques RLS

```sql
SELECT policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'auth' AND tablename = 'users';
```

**Résultat attendu:**
- ✅ Vide = Pas de politiques
- ❌ Résultats = Politiques trouvées (à analyser)


### Requête #4: Voir les Triggers avec Fonctions

```sql
SELECT 
  t.trigger_name, t.event_manipulation, t.action_timing,
  p.proname as trigger_function, t.action_statement
FROM information_schema.triggers t
LEFT JOIN pg_trigger pt ON pt.tgname = t.trigger_name
LEFT JOIN pg_proc p ON pt.tgfoid = p.oid
WHERE t.event_object_schema = 'auth' AND t.event_object_table = 'users';
```

**À chercher:** `RAISE EXCEPTION` basée sur le rôle = PROBLÈME


### Requête #5: Voir les Colonnes et Defaults

```sql
SELECT column_name, data_type, is_nullable, column_default, is_identity
FROM information_schema.columns
WHERE table_schema = 'auth' AND table_name = 'users'
ORDER BY ordinal_position;
```

**À chercher:** Colonne avec DEFAULT qui échoue pour users

---

## 📊 RÉSUMÉ DES CAUSES PROBABLES

### 🔴 Cause #1: Trigger AFTER INSERT (90% de chance)

**Symptôme:** Error 500 au signup des users

**Vérification:**
```sql
SELECT * FROM information_schema.triggers
WHERE event_object_schema = 'auth' AND event_object_table = 'users';
```

**Si trigger `confirm_user_email` trouvé:**
- Vérifier sa fonction pour une exception basée sur le rôle
- Si `RAISE EXCEPTION` pour users = PROBLÈME

**Solution:** Modifier le trigger pour ne pas lever exception


### 🔴 Cause #2: RLS trop restrictif (10% de chance)

**Symptôme:** Error 500 ou "Permission denied" au signup

**Vérification:**
```sql
SELECT rowsecurity FROM pg_tables
WHERE schemaname = 'auth' AND tablename = 'users';
```

**Si `rowsecurity = true`:**
```sql
SELECT * FROM pg_policies
WHERE schemaname = 'auth' AND tablename = 'users';
```

**Si politiques restrictives trouvées:**
- Vérifier si elles bloquent les users
- Modifier ou supprimer les politiques problématiques


### 🟡 Cause #3: Permissions manquantes

**Symptôme:** Error 500 ou "Permission denied"

**Vérification:**
```sql
SELECT * FROM information_schema.role_table_grants
WHERE table_schema = 'auth' AND table_name = 'users' AND grantee = 'anon';
```

**Si pas de permission INSERT:**
```sql
GRANT INSERT ON auth.users TO anon;
```

---

## 🔧 SOLUTIONS RAPIDES

### Si Trigger trouvé (problématique):

```sql
-- Tester en désactivant
ALTER TABLE auth.users DISABLE TRIGGER <NOM_DU_TRIGGER>;

-- Tester signup des users...

-- Réactiver
ALTER TABLE auth.users ENABLE TRIGGER <NOM_DU_TRIGGER>;

-- Modifier la fonction (voir AUTH_USERS_DIAGNOSTIC_REPORT.md)
```

### Si RLS = true (problématique):

```sql
-- Tester en désactivant
ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;

-- Tester signup des users...

-- Réactiver après correction
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
```

### Si Permissions manquantes:

```sql
-- Ajouter permission
GRANT INSERT, UPDATE, DELETE, SELECT ON auth.users TO anon;
GRANT USAGE ON SCHEMA auth TO anon;
```

---

## 📋 CHECKLIST D'EXÉCUTION

### Phase 1: Vérification (5-10 minutes)
- [ ] Allez dans Supabase Console → SQL Editor
- [ ] Exécutez Requête #1 (triggers)
- [ ] Notez le résultat
- [ ] Exécutez Requête #2 (RLS state)
- [ ] Notez le résultat
- [ ] Exécutez Requête #3 (RLS politiques)
- [ ] Notez le résultat

### Phase 2: Diagnostic (5-15 minutes)
- [ ] Analysez les résultats
- [ ] Identifiez le problème (trigger/RLS/permissions)
- [ ] Notez le trigger/politique problématique
- [ ] Vérifiez les logs Supabase (Logs → Auth Events)

### Phase 3: Test (5-10 minutes)
- [ ] Exécutez la requête de désactivation
- [ ] Testez le signup d'un user
- [ ] Vérifiez si ça marche
- [ ] Si oui, vous avez trouvé le problème

### Phase 4: Correction (10-30 minutes)
- [ ] Modifiez le trigger ou la politique
- [ ] Réactivez le trigger/RLS
- [ ] Testez à nouveau
- [ ] Confirmez que tout fonctionne

---

## 💡 CONSEILS PRATIQUES

1. **Exécutez UNE requête à la fois** dans Supabase
2. **Notez les résultats** de chaque requête
3. **Cherchez les erreurs** dans les logs Supabase
4. **Testez en désactivant** pour isoler le problème
5. **Vérifiez l'erreur réelle** (F12 → Console dans le navigateur)

---

## 📞 BESOIN D'AIDE?

**Si vous êtes bloqué:**
1. Lire **AUTH_USERS_DIAGNOSTIC_REPORT.md** (section "⚠️ PROBLÈME COURANT")
2. Vérifier les **logs Supabase** (Console → Logs)
3. Copier les résultats des requêtes
4. Consulter la **SYNTHESE_COMPLETE.md** pour les solutions

---

## 🎯 RÉSULTAT ATTENDU

Après avoir suivi ce diagnostic:

1. ✅ Vous saurez s'il y a des triggers
2. ✅ Vous saurez l'état de RLS
3. ✅ Vous aurez identifié le problème
4. ✅ Vous pourrez corriger en 1-2 minutes
5. ✅ Les users pourront se signup normalement

---

## 📁 FICHIERS À CONSULTER (par ordre d'importance)

1. **SYNTHESE_COMPLETE.md** - Vue d'ensemble (LIRE EN PREMIER)
2. **AUTH_USERS_DIAGNOSTIC_REPORT.md** - Détails complets
3. **SQL_DIAGNOSTIC_AUTH_USERS.sql** - Requêtes SQL
4. **TRIGGER_DETAILS.md** - Actions rapides

---

**Status:** ✅ Tous les outils sont prêts  
**Prochaine étape:** Ouvrir Supabase Console et exécuter les requêtes

Bonne chance! 🚀
