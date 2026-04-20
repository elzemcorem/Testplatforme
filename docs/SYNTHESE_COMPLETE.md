# 📊 SYNTHÈSE COMPLÈTE: Vérification auth.users - Triggers et RLS

**Généré:** 16/04/2026 à 23:23 UTC  
**Problème:** Users échouent avec 500 Error au signup (admin/contrôleur OK)  
**Contexte:** Trigger AFTER INSERT pour confirmation d'email vient d'être créé

---

## 🎯 RÉSUMÉ EXÉCUTIF

Vous rencontrez probablement **deux problèmes possibles**:

### 1️⃣ **Trigger AFTER INSERT trop restrictif** (90% de probabilité)
Le trigger pour confirmer les emails **lève une exception pour les users** au lieu de les traiter

### 2️⃣ **RLS trop restrictif ou politiques bloquantes** (10% de probabilité)  
Row Level Security empêche les users de s'insérer

---

## 🔧 VÉRIFICATION RAPIDE (5-10 MINUTES)

### ÉTAPE 1: Allez dans Supabase Console

1. Allez sur **https://app.supabase.com**
2. Sélectionnez votre projet
3. Cliquez sur **SQL Editor** (gauche)
4. Créez une nouvelle requête

### ÉTAPE 2: Exécutez cette requête

```sql
-- Vérifier TOUS les triggers sur auth.users
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

**Résultat:**
- ✅ **Aucune ligne** = Pas de triggers trouvés (continuez à ÉTAPE 3)
- ❌ **1 ou plusieurs triggers** = Trouvé! Vérifiez l'action en ÉTAPE 4

### ÉTAPE 3: Vérifiez l'état de RLS

```sql
-- État de RLS
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'auth' 
  AND tablename = 'users';
```

**Résultat:**
- ✅ `rowsecurity = false` = RLS désactivé ✓ OK
- ❌ `rowsecurity = true` = RLS activé, continuez à ÉTAPE 5

### ÉTAPE 4: Si trigger trouvé, voir la fonction

```sql
-- Voir les triggers avec leurs fonctions
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

**À chercher dans `action_statement`:**
- ❌ `RAISE EXCEPTION` basée sur le rôle = **C'EST LE PROBLÈME**
- ❌ `IF NEW.role = 'user'` + exception = **PROBLÈME**
- ✅ Juste une mise à jour normale = Probablement OK

### ÉTAPE 5: Si RLS = true, vérifier les politiques

```sql
-- Voir toutes les politiques RLS
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

**À chercher:**
- ❌ Politique `RESTRICTIVE` = Peut bloquer
- ❌ Politique qui mentionne `role != 'admin'` = Peut bloquer users
- ✅ Pas de politiques = RLS activé mais inactif (OK)

---

## 🎨 TABLEAU DE DIAGNOSTIC

| Vérification | ✅ OK | ⚠️ Problème | Action |
|---|---|---|---|
| **Triggers** | Aucun | 1+ trouvé | Voir ÉTAPE 4 |
| **RLS Activé** | false | true | Voir ÉTAPE 5 |
| **Politiques RLS** | Aucune | 1+ trouvée | Analyser les conditions |
| **Fonction Trigger** | Pas d'exception | RAISE EXCEPTION | **CORRIGER** |
| **Rôle "anon"** | Permissions INSERT | Pas de permission | GRANT INSERT |

---

## 🚀 SOLUTIONS SELON LES RÉSULTATS

### 🔴 Scenario 1: Trigger trouvé avec exception

**Le problème:** Trigger lève exception pour users

**Solution rapide:**
```sql
-- Désactiver pour tester
ALTER TABLE auth.users DISABLE TRIGGER <NOM_DU_TRIGGER>;

-- Tester le signup des users
-- Si ça marche, le trigger est le problème

-- Réactiver après confirmation
ALTER TABLE auth.users ENABLE TRIGGER <NOM_DU_TRIGGER>;
```

**Corriger le trigger:**
- Modifiez la fonction pour NE PAS lever exception pour users
- Ou utilisez une logique différente (webhook, Edge Function)

---

### 🔴 Scenario 2: RLS = true + politiques restrictives

**Le problème:** Politiques RLS bloquent les users

**Vérifier:**
```sql
-- Voir les conditions bloquantes
SELECT * FROM pg_policies
WHERE schemaname = 'auth' AND tablename = 'users';
```

**Solution:**
```sql
-- Temporairement, désactiver RLS pour tester
ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;

-- Tester le signup
-- Si ça marche, les politiques RLS sont le problème

-- Réactiver et corriger les politiques
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
```

---

### 🟡 Scenario 3: Rien trouvé

**Possible:**
- Les RPC Supabase ne sont pas disponibles
- Les métadonnées ne sont pas accessibles
- Le problème vient d'ailleurs

**Vérifier:**
```sql
-- Voir les logs PostgreSQL
SELECT pg_read_file('pg_log/postmaster.log', 0, 10000);

-- Ou vérifier les erreurs dans Supabase Console → Logs
```

---

## 📁 FICHIERS PRÉPARÉS POUR VOUS

### 1. **AUTH_USERS_DIAGNOSTIC_REPORT.md**
- Rapport complet avec 8 requêtes SQL
- Checklist de débogage détaillée
- Actions recommandées

### 2. **SQL_DIAGNOSTIC_AUTH_USERS.sql**
- 10 requêtes SQL prêtes à copier-coller
- Commentaires explicatifs pour chaque requête

### 3. **TRIGGER_DETAILS.md**
- Résumé d'urgence (5 minutes)
- Hypothèse probable
- Actions immédiates

### 4. **SYNTHÈSE_COMPLETE.md** (ce fichier)
- Vue d'ensemble complète
- Tableau diagnostic
- Solutions par scénario

---

## 💡 HYPOTHÈSE LA PLUS PROBABLE

Basé sur le contexte, **le problème est presque certainement le trigger AFTER INSERT:**

```sql
-- ❌ Ce que vous avez probablement fait:
CREATE OR REPLACE FUNCTION confirm_user_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Problème: Exception pour les users!
  IF NEW.role = 'user' THEN
    RAISE EXCEPTION 'Users cannot signup';  -- ❌ 500 ERROR!
  END IF;
  
  -- Confirmer l'email
  UPDATE auth.users 
  SET email_confirmed_at = NOW() 
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ✅ Solution: Ne pas lever exception pour users
CREATE OR REPLACE FUNCTION confirm_user_email()
RETURNS TRIGGER AS $$
BEGIN
  -- OK: Traiter tous les rôles normalement
  IF NEW.email IS NOT NULL THEN
    UPDATE auth.users 
    SET email_confirmed_at = NOW() 
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## ⚡ ACTIONS IMMÉDIATES (DANS L'ORDRE)

1. ✅ **Exécutez l'ÉTAPE 2** (vérifier triggers)
   - Si triggers trouvés → Allez à l'ÉTAPE 4

2. ✅ **Exécutez l'ÉTAPE 3** (vérifier RLS)
   - Si RLS = true → Allez à l'ÉTAPE 5

3. ✅ **Si trigger trouve avec exception:**
   - Désactivez le trigger: `ALTER TABLE auth.users DISABLE TRIGGER ...;`
   - Testez le signup
   - Si OK, modifiez le trigger
   - Réactivez

4. ✅ **Si RLS = true + politiques:**
   - Désactivez RLS: `ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;`
   - Testez le signup
   - Si OK, corrigez les politiques
   - Réactivez RLS

5. ✅ **Vérifiez les logs Supabase:**
   - Console → Logs → Cherchez "signup" ou erreurs

---

## 🔗 RESSOURCES

### Supabase SQL Editor
https://app.supabase.com → SQL Editor

### PostgreSQL Information Schema
https://www.postgresql.org/docs/current/information-schema.html

### Supabase Documentation
https://supabase.com/docs

---

## ✅ CHECKLIST FINALE

Avant de conclure, vérifiez:

- [ ] Exécuté ÉTAPE 2 (triggers)
- [ ] Noté le nom du trigger (s'il existe)
- [ ] Exécuté ÉTAPE 3 (RLS status)
- [ ] Exécuté ÉTAPE 4 (trigger function)
- [ ] Exécuté ÉTAPE 5 si RLS = true (politiques)
- [ ] Identifié le problème
- [ ] Testé la solution (désactiver trigger/RLS)
- [ ] Confirmé que users peuvent maintenant signup
- [ ] Corrigé le trigger/RLS et réactivé
- [ ] Testé à nouveau

---

## 📞 SUPPORT

Si vous êtes bloqué:
1. Partagez les résultats de chaque requête
2. Vérifiez les logs Supabase (Logs → Functions)
3. Consultez les erreurs console (F12 → Console)
4. Essayez de désactiver le trigger ou RLS pour isoler le problème

---

**Status:** ✅ Diagnostic complet préparé  
**Prochaine étape:** Exécuter les requêtes SQL ci-dessus dans Supabase Console

