# 🗄️ Installation de la Table Satisfaction Reports

## ⚠️ IMPORTANT: Cette étape est CRITIQUE

La table `satisfaction_reports` doit être créée dans Supabase pour que le système de rapports de satisfaction fonctionne correctement.

---

## 📋 Étapes d'Installation (Manuel dans Supabase)

### Étape 1: Accédez à Supabase

1. Allez à **https://app.supabase.com/**
2. Connectez-vous avec vos identifiants
3. Sélectionnez votre projet

### Étape 2: Ouvrez SQL Editor

1. Dans le menu latéral, cliquez sur **"SQL Editor"**
2. Cliquez sur **"New Query"**
3. Une nouvelle fenêtre d'édition s'ouvre

### Étape 3: Collez le SQL

Copiez-collez **tout le contenu** ci-dessous dans l'éditeur SQL:

```sql
-- SUPPRIMER LA TABLE SI ELLE EXISTE DÉJÀ (pour recréer avec les bonnes colonnes)
DROP TABLE IF EXISTS satisfaction_reports CASCADE;

-- Table pour les rapports de satisfaction de services
CREATE TABLE satisfaction_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exit_report_id UUID REFERENCES exit_reports(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Services avec leurs données
  dcm_requests INT DEFAULT 0,
  dcm_satisfied INT DEFAULT 0,
  dcm_unsatisfied INT DEFAULT 0,
  
  dtm_requests INT DEFAULT 0,
  dtm_satisfied INT DEFAULT 0,
  dtm_unsatisfied INT DEFAULT 0,
  
  daf_requests INT DEFAULT 0,
  daf_satisfied INT DEFAULT 0,
  daf_unsatisfied INT DEFAULT 0,
  
  qhse_requests INT DEFAULT 0,
  qhse_satisfied INT DEFAULT 0,
  qhse_unsatisfied INT DEFAULT 0,
  
  do_requests INT DEFAULT 0,
  do_satisfied INT DEFAULT 0,
  do_unsatisfied INT DEFAULT 0,
  
  -- Métadonnées
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX satisfaction_reports_exit_report_id ON satisfaction_reports(exit_report_id);
CREATE INDEX satisfaction_reports_vehicle_id ON satisfaction_reports(vehicle_id);
CREATE INDEX satisfaction_reports_user_id ON satisfaction_reports(user_id);

-- Activer Row Level Security (RLS)
ALTER TABLE satisfaction_reports ENABLE ROW LEVEL SECURITY;

-- Créer une politique pour autoriser tous les utilisateurs authentifiés
CREATE POLICY "satisfaction_reports_all"
ON satisfaction_reports FOR ALL
USING (true)
WITH CHECK (true);
```

### Étape 4: Exécutez le SQL

1. Cliquez sur le bouton **"Run"** (ou appuyez sur `Ctrl+Enter`)
2. Attendez le résultat

### ✅ Si tout fonctionne:
Vous devriez voir:
```
✅ Success. No rows returned
```

### ❌ Si une erreur s'affiche:

**Erreur: "table already exists"**
- La table existe déjà, c'est normal
- Le SQL inclut `DROP TABLE IF EXISTS` qui la supprime d'abord
- Essayez d'exécuter à nouveau

**Erreur: "permission denied"**
- Vous n'avez pas les permissions d'admin
- Contactez l'administrateur du projet Supabase
- Ou utilisez un compte avec droits suffisants

**Erreur: "relation does not exist"**
- Les tables `exit_reports` ou `vehicles` n'existent pas
- Vérifiez que votre base de données a les bonnes tables
- Consultez le fichier `REQUIRED_SQL_MIGRATION.md`

---

## 🔍 Vérification de la Création

Après exécution réussie, vérifiez que la table existe:

### Requête de Vérification:
```sql
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'satisfaction_reports'
ORDER BY ordinal_position;
```

### Résultat attendu:
```
table_name          | column_name      | data_type
--------------------|------------------|----------
satisfaction_reports| id               | uuid
satisfaction_reports| exit_report_id   | uuid
satisfaction_reports| vehicle_id       | uuid
satisfaction_reports| user_id          | uuid
satisfaction_reports| dcm_requests     | integer
satisfaction_reports| dcm_satisfied    | integer
satisfaction_reports| dcm_unsatisfied  | integer
... (15 colonnes de services)
satisfaction_reports| notes            | text
satisfaction_reports| created_by       | uuid
satisfaction_reports| created_at       | timestamp with time zone
satisfaction_reports| updated_at       | timestamp with time zone
```

---

## 🧪 Test de Fonctionnement

Après la création, testez l'insertion:

```sql
INSERT INTO satisfaction_reports (
  user_id,
  created_by,
  dcm_requests,
  dcm_satisfied,
  dcm_unsatisfied,
  notes
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,  -- Remplacez par votre user_id
  '550e8400-e29b-41d4-a716-446655440000'::uuid,  -- Remplacez par votre user_id
  10,
  8,
  2,
  'Test de satisfaction'
)
RETURNING *;
```

Si vous voyez le nouvel enregistrement inséré, **la table fonctionne parfaitement!** ✅

---

## 📊 Colonnes de la Table

### Identifiants
- `id` - UUID unique du rapport
- `exit_report_id` - Référence au rapport de sortie (nullable)
- `vehicle_id` - Référence au véhicule (nullable)
- `user_id` - Utilisateur qui crée le rapport (NOT NULL)
- `created_by` - Utilisateur qui a créé (NOT NULL)

### Services (5 services × 3 colonnes)

#### 🏢 DCM (Direction & Management)
- `dcm_requests` - Nombre total de demandes
- `dcm_satisfied` - Nombre de demandes satisfaites
- `dcm_unsatisfied` - Nombre de demandes insatisfaites

#### 🚗 DTM (Département Technique & Mécanique)
- `dtm_requests`, `dtm_satisfied`, `dtm_unsatisfied`

#### 📋 DAF (Département Administratif & Financier)
- `daf_requests`, `daf_satisfied`, `daf_unsatisfied`

#### ⚠️ QHSE (Qualité, Hygiène, Sécurité)
- `qhse_requests`, `qhse_satisfied`, `qhse_unsatisfied`

#### 📊 DO (Direction Opérationnelle)
- `do_requests`, `do_satisfied`, `do_unsatisfied`

### Métadonnées
- `notes` - Notes et observations (TEXT)
- `created_at` - Timestamp de création
- `updated_at` - Timestamp de dernière modification

---

## 🔒 Politique RLS (Row Level Security)

La politique créée autorise:
- ✅ Tous les utilisateurs authentifiés à lire
- ✅ Tous les utilisateurs authentifiés à insérer
- ✅ Tous les utilisateurs authentifiés à mettre à jour
- ✅ Tous les utilisateurs authentifiés à supprimer

**Note:** Cette politique est permissive. Pour plus de sécurité en production, modifiez-la pour restreindre par rôle:

```sql
-- Politique restrictive (optionnelle)
CREATE POLICY "satisfaction_reports_authenticated"
ON satisfaction_reports
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "satisfaction_reports_own"
ON satisfaction_reports
FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

---

## 🚀 Après la Création

Une fois la table créée:

1. ✅ Le tableau de satisfaction dans "Rapport de Sortie" fonctionne
2. ✅ Les données se sauvegardent dans la base
3. ✅ Les exports (CSV, PDF, Word) incluent ces données
4. ✅ Le chatbot peut afficher les statistiques

**Testez directement dans l'application:**
- Allez à "Rapport de Sortie"
- Remplissez le tableau de satisfaction
- Cliquez sur "Sauvegarder"
- Vous devriez voir un message de succès! 🎉

---

## 📞 Troubleshooting

### "Column count mismatch"
- Vérifiez que vous avez copié le SQL entièrement
- Assurez-vous qu'il n'y a pas de caractères spéciaux

### "Foreign key constraint violated"
- Vérifiez que les tables `exit_reports` et `vehicles` existent
- Les IDs de référence doivent exister dans ces tables

### "Already exists" - Tout fonctionne!
- C'est normal, la table a déjà été créée
- Vous pouvez vérifier avec une requête SELECT

### Aucun message d'erreur mais la table n'existe pas
- Rechargez la page
- Vérifiez dans l'onglet "Tables" de Supabase

---

## 📝 Notes Importantes

⚠️ **ATTENTION:**
- Exécuter `DROP TABLE CASCADE` **SUPPRIMERA** toutes les données existantes
- Si vous avez déjà des données, faites une sauvegarde d'abord:
  ```sql
  SELECT * FROM satisfaction_reports;
  ```

✅ **BONNES PRATIQUES:**
- Gardez une copie du SQL quelque part (déjà fait dans le repo)
- Testez dans un environnement de développement d'abord
- Vérifiez les autorisations avant d'exécuter
- Documentez les changements de schéma

---

## 🎯 Checklist de Validation

- [ ] J'ai accédé à Supabase Dashboard
- [ ] J'ai ouvert SQL Editor
- [ ] J'ai copié le SQL complet
- [ ] J'ai exécuté la requête
- [ ] Je vois le message de succès
- [ ] J'ai vérifié la table existe (requête SELECT)
- [ ] J'ai testé une insertion
- [ ] Rapport de Satisfaction fonctionne dans l'app
- [ ] Les exports (CSV/PDF/Word) fonctionnent
- [ ] Le chatbot affiche les données correctement

---

**Dernière mise à jour:** 17/04/2026  
**Status:** ✅ Prêt à exécuter  
**Dépendances:** Supabase CLI ou Dashboard SQL Editor
