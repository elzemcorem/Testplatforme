# Checklist de Vérification - Authentification allowed_users

## ✅ Vérifications avant le déploiement

### 1. Base de données

- [ ] Table `allowed_users` existe dans Supabase
- [ ] Colonnes correctes : `id`, `noms`, `email`, `role`, `created_at`, `password`
- [ ] Au moins un utilisateur de test existe dans la table
- [ ] Exemple de requête :
  ```sql
  SELECT * FROM allowed_users LIMIT 1;
  ```

### 2. Code

- [ ] `src/utils/auth.ts` : Fonctions `checkAllowedUser` et `determineUserRole` implémentées
- [ ] `src/contexts/AuthContext.tsx` : Import et utilisation des nouvelles fonctions
- [ ] `src/components/LoginPage.tsx` : Message d'erreur mis à jour
- [ ] Pas d'erreur TypeScript : `npm run build`
- [ ] Pas d'erreur de console : `npm run dev`

### 3. Tests manuels

#### Test 1 : Connexion d'un utilisateur autorisé
```
1. Ajouter un email autorisé dans allowed_users :
   INSERT INTO allowed_users (noms, email, role) 
   VALUES ('Test User', 'test.user@example.com', 'user');

2. Ouvrir la page de login
3. Entrer : test.user@example.com + mot de passe
4. Résultat attendu :
   - Console : 🔍 Checking if test.user@example.com...
   - Console : ✅ User found with role: user
   - Connexion réussie
   - Page principale affichée
```

#### Test 2 : Connexion d'un email non autorisé
```
1. Ouvrir la page de login
2. Entrer : email.non.autorise@example.com + mot de passe
3. Résultat attendu :
   - Console : 🔍 Checking if email.non.autorise@example.com...
   - Console : ❌ User is NOT in allowed_users
   - Message d'erreur : "Accès refusé..."
   - Pas de connexion
```

#### Test 3 : Rôles assignés correctement
```
1. Ajouter 3 utilisateurs avec rôles différents :
   INSERT INTO allowed_users (noms, email, role) VALUES
   ('Admin', 'admin@test.com', 'admin'),
   ('Controller', 'ctrl@test.com', 'controller'),
   ('User', 'user@test.com', 'user');

2. Connecter avec admin@test.com
3. Vérifier dans Developer Tools (F12) :
   - Console : "role: admin"
   - Header/Navigation : Affiche les éléments admin

4. Répéter pour les autres rôles
```

#### Test 4 : Rechargement de page maintient la session
```
1. Connecter avec un utilisateur autorisé
2. Rafraîchir la page (F5)
3. Résultat attendu :
   - Console : 🔍 Loading user session...
   - Console : ✅ Active session found
   - Pas de redirection vers login
   - Utilisateur reste connecté
```

#### Test 5 : Utilisateur non autorisé dans session sauvegardée
```
1. Connecter avec un utilisateur autorisé
2. Dans la console Supabase, supprimer cet utilisateur de allowed_users
3. Rafraîchir la page
4. Résultat attendu :
   - Console : ❌ User not in allowed_users
   - Redirection vers la page de login
   - Message de déconnexion
```

### 4. Performance

- [ ] Les requêtes vers `allowed_users` sont rapides (< 500ms)
- [ ] Pas de double-requêtes observées dans Network
- [ ] Console n'affiche pas d'erreurs d'authentification

### 5. Sécurité

- [ ] ✅ Pas de mot de passe en localStorage (sauf token JWT)
- [ ] ✅ Vérification server-side dans Supabase
- [ ] ✅ Rôles définis dans la base de données
- [ ] ✅ Aucune création automatique sans autorisation

### 6. Messages utilisateur

- [ ] Message d'erreur correct pour email non autorisé
- [ ] Message d'erreur correct pour mot de passe incorrect
- [ ] Message de succès à la connexion

## 📋 Données de test recommandées

Ajouter à la table `allowed_users` pour les tests :

```sql
INSERT INTO allowed_users (id, noms, email, role, created_at) VALUES
(1, 'Administrateur Test', 'admin@energytest.com', 'admin', NOW()),
(2, 'Contrôleur Test', 'controller@energytest.com', 'controller', NOW()),
(3, 'Utilisateur Test', 'user@energytest.com', 'user', NOW());
```

Credentials de test :
| Email | Rôle | Mot de passe | Notes |
|-------|------|-------------|-------|
| admin@energytest.com | admin | test1234 | Accès complet |
| controller@energytest.com | controller | test1234 | Validation/Contrôle |
| user@energytest.com | user | test1234 | Accès standard |

## 🚀 Déploiement

### Avant le déploiement en production

1. [ ] Tous les tests manuels réussissent
2. [ ] Tous les utilisateurs autorisés sont dans `allowed_users`
3. [ ] Les rôles sont correctement assignés
4. [ ] Tester avec un vrai email utilisateur
5. [ ] Documenter l'accès administrateur
6. [ ] Activer les logs d'authentification

### Après le déploiement

1. [ ] Vérifier les logs Supabase
2. [ ] Tester la connexion de plusieurs utilisateurs
3. [ ] Monitorer les erreurs d'authentification
4. [ ] Vérifier les performances

## 🐛 Troubleshooting

### Erreur : "User not found in allowed_users"
```
Solution :
1. Vérifier que l'email existe exactement dans la table
2. Attention à la casse (case-sensitive)
3. Vérifier qu'il n'y a pas d'espaces avant/après
4. Recharger la page
```

### Erreur : "Invalid login credentials"
```
Solution :
1. Vérifier le mot de passe
2. Si première connexion, le mot de passe peut ne pas être défini
3. Vérifier que l'email existe dans allowed_users
4. Réinitialiser le mot de passe dans Supabase
```

### Erreur : Session non chargée après rechargement
```
Solution :
1. Vérifier les cookies et localStorage sont activés
2. Vérifier que Supabase Auth fonctionne
3. Vérifier que le token n'a pas expiré
4. Supprimer localStorage et se reconnecter
```

### Rôle affiche "user" mais devrait être "admin"
```
Solution :
1. Vérifier la table allowed_users : role = 'admin'
2. Attendre la prochaine connexion
3. Se déconnecter et reconnecter
4. Vérifier la casse du rôle (doit être minuscule)
```

## ✨ Signaux de succès

Une implémentation réussie affichera ces logs lors d'une connexion :

```javascript
// Console lors du login
🔍 Checking if user@example.com is in allowed_users table...
✅ User user@example.com found in allowed_users with role: admin
🔐 Verifying email in allowed_users table: user@example.com
✅ User is authorized, attempting login...
✅ Login successful!
```

Et au rechargement :

```javascript
🔄 Loading user session from Supabase...
✅ Active session found for: user@example.com
✅ User loaded from Supabase session: user@example.com
```

---

**Statut** : 📋 Checklist complète
**Date** : 2026-04-16
