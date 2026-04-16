# 👨‍💼 Guide Administrateur - Gestion des utilisateurs allowed_users

## 🔧 Commandes SQL essentielles

### 1. AJOUTER UN NOUVEL UTILISATEUR AUTORISÉ

```sql
-- Ajouter un utilisateur standard
INSERT INTO allowed_users (noms, email, role, created_at)
VALUES ('Prénom Nom', 'email@company.com', 'user', NOW());

-- Ajouter un administrateur
INSERT INTO allowed_users (noms, email, role, created_at)
VALUES ('Admin Name', 'admin@company.com', 'admin', NOW());

-- Ajouter un contrôleur
INSERT INTO allowed_users (noms, email, role, created_at)
VALUES ('Controller Name', 'controller@company.com', 'controller', NOW());
```

### 2. VOIR TOUS LES UTILISATEURS

```sql
-- Voir tous les utilisateurs autorisés
SELECT id, noms, email, role, created_at 
FROM allowed_users 
ORDER BY created_at DESC;

-- Compter par rôle
SELECT role, COUNT(*) as nombre 
FROM allowed_users 
GROUP BY role;

-- Voir un utilisateur spécifique
SELECT * 
FROM allowed_users 
WHERE email = 'user@company.com';
```

### 3. MODIFIER LES UTILISATEURS

```sql
-- Changer le rôle d'un utilisateur
UPDATE allowed_users 
SET role = 'admin' 
WHERE email = 'user@company.com';

-- Changer le nom d'un utilisateur
UPDATE allowed_users 
SET noms = 'Nouveau Nom' 
WHERE email = 'user@company.com';

-- Mettre à jour plusieurs champs
UPDATE allowed_users 
SET noms = 'Jean Dupont Updated', role = 'controller' 
WHERE email = 'jean@company.com';
```

### 4. SUPPRIMER UN UTILISATEUR

```sql
-- Désactiver un utilisateur (le supprimer de allowed_users)
DELETE FROM allowed_users 
WHERE email = 'olduser@company.com';

-- Supprimer tous les utilisateurs avec un certain rôle
DELETE FROM allowed_users 
WHERE role = 'user';

-- Supprimer les utilisateurs inactifs (exemple: créés il y a plus d'1 an)
DELETE FROM allowed_users 
WHERE created_at < NOW() - INTERVAL '1 year';
```

### 5. RECHERCHER ET FILTRER

```sql
-- Tous les administrateurs
SELECT * 
FROM allowed_users 
WHERE role = 'admin' 
ORDER BY noms;

-- Tous les contrôleurs
SELECT * 
FROM allowed_users 
WHERE role = 'controller' 
ORDER BY noms;

-- Utilisateurs créés aujourd'hui
SELECT * 
FROM allowed_users 
WHERE DATE(created_at) = CURRENT_DATE;

-- Utilisateurs actifs qui n'ont jamais utilisé leur mot de passe
SELECT * 
FROM allowed_users 
WHERE password IS NULL 
ORDER BY created_at DESC;
```

## 📊 Statistiques utiles

```sql
-- Nombre total d'utilisateurs
SELECT COUNT(*) as total_utilisateurs 
FROM allowed_users;

-- Répartition par rôle
SELECT 
  role,
  COUNT(*) as nombre,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM allowed_users), 1) as pourcentage
FROM allowed_users 
GROUP BY role;

-- Derniers utilisateurs ajoutés
SELECT id, noms, email, role, created_at 
FROM allowed_users 
ORDER BY created_at DESC 
LIMIT 10;

-- Utilisateurs sans nom assigné
SELECT * 
FROM allowed_users 
WHERE noms IS NULL OR noms = '';
```

## 🚨 Audits de sécurité

```sql
-- Vérifier les doublons d'email
SELECT email, COUNT(*) 
FROM allowed_users 
GROUP BY email 
HAVING COUNT(*) > 1;

-- Vérifier les rôles invalides
SELECT DISTINCT role 
FROM allowed_users 
WHERE role NOT IN ('admin', 'controller', 'user', NULL);

-- Lister les emails suspects
SELECT * 
FROM allowed_users 
WHERE email NOT LIKE '%@%.%';  -- Sans domaine valide
```

## 🔄 Opérations de maintenance

### Backup avant modification critique

```sql
-- Créer une copie de sauvegarde
CREATE TABLE allowed_users_backup AS 
SELECT * FROM allowed_users;

-- Après tests, supprimer la sauvegarde
DROP TABLE allowed_users_backup;
```

### Réinitialiser les données de test

```sql
-- ⚠️ ATTENTION: Ceci supprime TOUS les utilisateurs
-- Ne faire que pour les tests!
DELETE FROM allowed_users;

-- Puis réinsérer les données de départ
INSERT INTO allowed_users (noms, email, role, created_at) VALUES
('Admin Test', 'admin@test.local', 'admin', NOW()),
('Controller Test', 'controller@test.local', 'controller', NOW()),
('User Test', 'user@test.local', 'user', NOW());
```

## 👥 Scénarios courants

### Scénario 1 : Nouvel employé arrive

```sql
-- L'ajouter à la table
INSERT INTO allowed_users (noms, email, role, created_at)
VALUES ('Prénom Nom', 'prenom.nom@company.com', 'user', NOW());

-- Lui envoyer ses identifiants (email + lien de login)
-- À la première connexion, il créera son mot de passe
```

### Scénario 2 : Promotion d'un utilisateur

```sql
-- Avant: role = 'user'
-- Après: role = 'controller'
UPDATE allowed_users 
SET role = 'controller' 
WHERE email = 'user@company.com';

-- Prend effet à la prochaine connexion
```

### Scénario 3 : Départ d'un employé

```sql
-- Supprimer immédiatement l'accès
DELETE FROM allowed_users 
WHERE email = 'ancien.employe@company.com';

-- L'utilisateur ne pourra plus se connecter
```

### Scénario 4 : Oublier son mot de passe

```sql
-- Réinitialiser le mot de passe via Supabase Auth
-- L'utilisateur recevra un email de réinitialisation
-- (C'est géré par Supabase, pas par cette table)

-- Cette table ne stocke pas les mots de passe en clair
-- Colonne password n'est pas utilisée, elle est pour référence seulement
```

## 📋 Checklist d'administration

### Onboarding d'un nouvel utilisateur
- [ ] Email ajouté à `allowed_users` avec le bon rôle
- [ ] Email de bienvenue envoyé avec le lien de login
- [ ] Utilisateur a créé son mot de passe
- [ ] Accès vérifié et rôle correct
- [ ] Documentation d'utilisation envoyée

### Audit mensuel
- [ ] Vérifier les nouveaux utilisateurs ajoutés
- [ ] Vérifier les changements de rôle
- [ ] Supprimer les utilisateurs inactifs
- [ ] Vérifier qu'aucun rôle invalide n'existe
- [ ] Sauvegarder les données

### Sécurité
- [ ] Aucun email dupliqué
- [ ] Aucun rôle invalide
- [ ] Tous les emails valides (avec @domaine)
- [ ] Pas de données sensibles en clair
- [ ] Logs d'authentification consultés

## 🔍 Requête SQL d'export pour rapports

```sql
-- Export complet pour rapport
SELECT 
  ROW_NUMBER() OVER (ORDER BY created_at DESC) as "N°",
  noms as "Nom Complet",
  email as "Email",
  role as "Rôle",
  created_at as "Date d'ajout",
  CASE 
    WHEN password IS NULL THEN 'Pas encore connecté'
    ELSE 'Connecté'
  END as "Statut d'accès"
FROM allowed_users
ORDER BY created_at DESC;
```

## 🛠️ Troubleshooting administrateur

### Problème : "Email already exists"
```sql
-- Vérifier les doublons
SELECT email, COUNT(*) FROM allowed_users GROUP BY email;

-- Supprimer les doublons (garder le plus récent)
DELETE FROM allowed_users 
WHERE id NOT IN (
  SELECT MAX(id) FROM allowed_users 
  GROUP BY email
);
```

### Problème : Utilisateur bloqué au rôle "user"
```sql
-- Vérifier l'email dans la table
SELECT * FROM allowed_users WHERE email = 'user@company.com';

-- Mettre à jour si nécessaire
UPDATE allowed_users SET role = 'admin' WHERE email = 'user@company.com';

-- L'utilisateur doit se déconnecter et reconnecter
```

### Problème : Un utilisateur ne peut pas se connecter
```sql
-- Vérifier qu'il existe dans allowed_users
SELECT * FROM allowed_users WHERE email = 'user@company.com';

-- Si absent, l'ajouter :
INSERT INTO allowed_users (noms, email, role, created_at)
VALUES ('Utilisateur', 'user@company.com', 'user', NOW());

-- Si présent mais pas d'accès, vérifier Supabase Auth
-- (C'est un problème Supabase, pas cette table)
```

## 📞 Support et escalade

### Si un utilisateur ne peut pas se connecter

1. ✅ **Étape 1** : Vérifier dans `allowed_users`
   ```sql
   SELECT * FROM allowed_users WHERE email = 'user@email.com';
   ```

2. ✅ **Étape 2** : Si absent, l'ajouter
3. ✅ **Étape 3** : Si présent, vérifier Supabase Auth dans le dashboard
4. ✅ **Étape 4** : Proposer une réinitialisation de mot de passe

---

**Dernière mise à jour** : 16 avril 2026
**Version** : 1.0
**Responsable** : Administrateur système
