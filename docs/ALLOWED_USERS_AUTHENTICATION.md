# Système d'Authentification avec Allowed Users

## Vue d'ensemble

Ce système d'authentification restreint l'accès à la plateforme **uniquement aux utilisateurs autorisés** présents dans la table Supabase `allowed_users`.

## Table allowed_users

Toutes les colonnes de référence :

```
- id (integer, PK) - Identifiant unique
- noms (varchar, nullable) - Nom complet de l'utilisateur
- email (varchar, NOT NULL) - Email unique et obligatoire
- role (varchar, nullable) - Rôle assigné : "admin", "controller", ou "user"
- created_at (timestamp, nullable) - Date de création
- password (varchar, nullable) - Mot de passe (stocké dans Supabase Auth)
```

## Fonctionnement du flux d'authentification

### 1. Tentative de connexion
```
Email + Mot de passe → Login
         ↓
Vérifier si email existe dans allowed_users
         ↓
Si NON → ❌ Accès refusé
Si OUI → Continuer
         ↓
Vérifier Supabase Auth (email + password)
         ↓
Si valide → ✅ Connexion réussie
Si invalide → ❌ Identifiants incorrects
```

### 2. Attribution du rôle
Le rôle est **automatiquement attribué** à partir de la colonne `role` de la table `allowed_users`.

Les rôles disponibles :
- **admin** - Accès administrateur complet
- **controller** - Accès contrôleur (gestion et vérification)
- **user** - Accès utilisateur standard

### 3. Création de compte

**Important** : Un utilisateur ne peut créer un compte que si son email est déjà présent dans la table `allowed_users`.

Flux :
```
Email + Mot de passe → Signup
         ↓
Vérifier si email existe dans allowed_users
         ↓
Si NON → ❌ Signup refusé (email non autorisé)
Si OUI → Récupérer le nom et le rôle depuis allowed_users
         ↓
Créer le compte dans Supabase Auth
         ↓
✅ Compte créé avec le rôle assigné
```

## Configuration dans le code

### Fichier: `src/utils/auth.ts`

#### `checkAllowedUser(email: string)`
Vérifie si un utilisateur est autorisé dans la table `allowed_users`.

```typescript
const result = await checkAllowedUser('user@example.com');
// Retourne:
// {
//   allowed: true,
//   role: 'admin',
//   name: 'Jean Dupont',
//   id: 1
// }
```

#### `determineUserRole(email: string)`
Récupère le rôle d'un utilisateur depuis la table `allowed_users`.

```typescript
const role = await determineUserRole('user@example.com');
// Retourne: 'admin' | 'controller' | 'user'
```

### Fichier: `src/contexts/AuthContext.tsx`

Le contexte d'authentification implémente :
- ✅ Vérification dans `allowed_users` avant le login
- ✅ Vérification dans `allowed_users` avant le signup
- ✅ Attribution du rôle depuis la table
- ✅ Affichage du nom depuis la table

## Ajouter un nouvel utilisateur

Pour autoriser un nouvel utilisateur :

1. **Insérer dans la table `allowed_users`** :
```sql
INSERT INTO allowed_users (noms, email, role, created_at, password)
VALUES ('Prénom Nom', 'email@example.com', 'admin', NOW(), NULL);
```

2. **L'utilisateur peut se connecter** avec son email
3. **Le mot de passe** est créé lors de la première connexion

## Modifier le rôle d'un utilisateur

```sql
UPDATE allowed_users
SET role = 'controller'
WHERE email = 'user@example.com';
```

Le changement de rôle prend effet à la prochaine connexion.

## Messages d'erreur pour l'utilisateur

### Accès refusé au login
> "Accès refusé. Veuillez vérifier que votre email est autorisé dans le système. Contactez un administrateur si vous pensez que c'est une erreur."

Cela signifie que l'email n'existe pas dans la table `allowed_users`.

### Mot de passe incorrect
Le message d'erreur reste le même pour l'email n'existe pas ou mot de passe incorrect (sécurité).

## Sécurité

✅ **Seuls les emails autorisés** peuvent accéder à la plateforme
✅ **Les rôles sont définis** dans la base de données (non côté client)
✅ **Vérification côté serveur** via Supabase Auth
✅ **Aucun compte ne peut être créé** sans autorisation préalable

## Débogage

Pour voir les logs de vérification :
1. Ouvrir la console du navigateur (F12)
2. Chercher les messages avec 🔍, ✅, ❌
3. Les logs montreront :
   - Si l'email est trouvé dans `allowed_users`
   - Quel rôle est assigné
   - Si la vérification Supabase Auth réussit

## Exemple de table remplie

| id  | noms | email | role | created_at |
|-----|------|-------|------|------------|
| 1 | Jean Dupont | jean@example.com | admin | 2024-01-15 |
| 2 | Marie Martin | marie@example.com | controller | 2024-01-15 |
| 3 | Pierre Durand | pierre@example.com | user | 2024-01-16 |

## Troubleshooting

### "Email not in allowed_users"
- Vérifier que l'email existe exactement dans la table
- Les emails sont sensibles à la casse
- Vérifier qu'il n'y a pas d'espaces

### "Invalid login credentials"
- Le mot de passe est incorrect
- Ou c'est la première connexion (le compte n'a pas encore de mot de passe)

### Impossible de voir son rôle
- Attendre le rechargement de la page après connexion
- Ou se déconnecter et reconnecter
