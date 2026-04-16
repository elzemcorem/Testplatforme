# Guide d'Implémentation - Authentification allowed_users

## ✅ Changements effectués

### 1. **Modification du système de rôles** (`src/utils/auth.ts`)

#### Nouvelles fonctions :

**`checkAllowedUser(email: string)`**
- Vérifie si un email existe dans la table `allowed_users`
- Retourne : allowed (boolean), role, name, id
- Utilise Supabase pour interroger la table

**`determineUserRole(email: string)`** (maintenant async)
- Récupère le rôle depuis la table `allowed_users`
- Fallback : "user" si pas trouvé
- Remplace l'ancienne logique basée sur les chiffres de l'email

### 2. **Mise à jour du contexte d'authentification** (`src/contexts/AuthContext.tsx`)

**Login :**
- ✅ Vérification dans `allowed_users` AVANT d'essayer Supabase Auth
- ✅ Rejet si email non autorisé
- ✅ Attribution du rôle depuis la table

**Signup :**
- ✅ Rejet si email pas dans `allowed_users`
- ✅ Utilisation du nom et rôle depuis la table
- ✅ Pas de création automatique sans autorisation

**Session :**
- ✅ Vérification de l'autorisation au démarrage
- ✅ Déconnexion automatique si non autorisé

### 3. **Message d'erreur mis à jour** (`src/components/LoginPage.tsx`)

```
"Accès refusé. Veuillez vérifier que votre email est autorisé 
dans le système. Contactez un administrateur si vous pensez 
que c'est une erreur."
```

## 🚀 Configuration requise

### Table Supabase - `allowed_users`

```sql
CREATE TABLE allowed_users (
  id INTEGER PRIMARY KEY,
  noms VARCHAR NULLABLE,
  email VARCHAR NOT NULL UNIQUE,
  role VARCHAR NULLABLE,
  created_at TIMESTAMP NULLABLE,
  password VARCHAR NULLABLE
);
```

### Données de départ

Insérez les utilisateurs autorisés :

```sql
INSERT INTO allowed_users (id, noms, email, role, created_at) VALUES
(1, 'Jean Admin', 'jean.admin@example.com', 'admin', NOW()),
(2, 'Marie Controleur', 'marie.controleur@example.com', 'controller', NOW()),
(3, 'Pierre Utilisateur', 'pierre.user@example.com', 'user', NOW());
```

## 📋 Rôles disponibles

| Rôle | Code | Usage |
|------|------|-------|
| Admin | `admin` | Accès complet, gestion complète |
| Contrôleur | `controller` | Vérification et validation |
| Utilisateur | `user` | Accès standard |

## 🔄 Flux d'authentification complet

```
1. Utilisateur entre email + mot de passe
            ↓
2. Vérification dans allowed_users (checkAllowedUser)
            ↓
   ❌ Pas trouvé → Erreur "Email non autorisé"
   ✅ Trouvé → Continuer
            ↓
3. Vérification Supabase Auth (credentials)
            ↓
   ❌ Mot de passe incorrect → Erreur "Identifiants incorrects"
   ✅ Correct → Continuer
            ↓
4. Récupération du rôle depuis allowed_users
            ↓
5. ✅ Connexion réussie avec le rôle assigné
```

## 🔐 Points de sécurité

✅ **Whitelist** - Seuls les emails de la table `allowed_users`
✅ **Rôles** - Définis côté base de données
✅ **Dual check** - Allowed_users + Supabase Auth
✅ **Sans auto-création** - Aucun compte ne peut être créé sans autorisation

## 🧪 Test rapide

1. Ajouter un email à `allowed_users` :
```sql
INSERT INTO allowed_users (noms, email, role) 
VALUES ('Test User', 'test@example.com', 'user');
```

2. Ouvrir la page de login
3. Entrer `test@example.com` et un mot de passe (n'importe lequel)
4. La console doit afficher :
   - 🔍 "Checking if test@example.com is in allowed_users table..."
   - ✅ "User test@example.com found in allowed_users with role: user"

## 📝 Pour ajouter un nouvel utilisateur

### Étape 1 : Ajouter dans allowed_users
```sql
INSERT INTO allowed_users (noms, email, role, created_at)
VALUES ('Nom Complet', 'email@example.com', 'user', NOW());
```

### Étape 2 : L'utilisateur se connecte
L'utilisateur utilise son email et crée un mot de passe à la première connexion.

### Étape 3 : Changement du rôle (si nécessaire)
```sql
UPDATE allowed_users SET role = 'admin' WHERE email = 'email@example.com';
```
Le nouveau rôle prend effet à la prochaine connexion.

## 🐛 Débogage

### Voir les logs
1. Appuyer sur F12 dans le navigateur (Developer Console)
2. Chercher les logs avec ces emojis :
   - 🔍 = Vérification en cours
   - ✅ = Succès
   - ❌ = Erreur

### Logs attendus pour une connexion réussie
```
🔍 Checking if test@example.com is in allowed_users table...
✅ User test@example.com found in allowed_users with role: user
🔐 Verifying email in allowed_users table: test@example.com
✅ User is authorized, attempting login...
✅ Login successful!
```

## ⚡ Optimisations possibles

Pour aller plus loin :
1. Ajouter un cache des rôles (Redis)
2. Implémenter une page d'admin pour gérer les utilisateurs
3. Ajouter un audit log des authentifications
4. Implémenter SSO pour les rôles
5. Ajouter une validation du mot de passe plus stricte

## 📚 Documentation complète

Voir `src/ALLOWED_USERS_AUTHENTICATION.md` pour les détails complets.

## ✨ Résumé des changements

| Fichier | Changement |
|---------|-----------|
| `src/utils/auth.ts` | ➕ Nouvelles functions async pour vérifier allowed_users |
| `src/contexts/AuthContext.tsx` | 🔧 Vérification allowed_users dans login/signup/session |
| `src/components/LoginPage.tsx` | 📝 Message d'erreur mis à jour |
| `src/ALLOWED_USERS_AUTHENTICATION.md` | ➕ Nouveau (documentation) |
| `src/IMPLEMENTATION_GUIDE.md` | ➕ Nouveau (ce fichier) |

---

**Status** : ✅ Prêt pour la production
**Sécurité** : ⚠️ À adapter selon vos politiques internes
