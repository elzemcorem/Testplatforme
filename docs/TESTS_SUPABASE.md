# 🧪 Tests Supabase - Bénin Petro

## Guide de Test Complet pour l'Authentification Supabase

---

## 📋 Tests à Effectuer

### Test 1 : Création de Compte Automatique (Première Connexion)

**Objectif** : Vérifier que les nouveaux comptes sont créés automatiquement

**Étapes :**
1. Ouvrir la console du navigateur (F12)
2. Vider le localStorage : `localStorage.clear()`
3. Recharger la page
4. Sur la page de connexion, entrer :
   - Email : `admin1@beninpetro.com`
   - Mot de passe : `test123456`
5. Cliquer sur "Se connecter"

**Résultat Attendu :**
```
Console logs :
🔐 Attempting Supabase login for: admin1@beninpetro.com
❌ Login failed: Invalid login credentials
📝 Account not found, creating new account...
📝 Creating account for: admin1@beninpetro.com with role: admin
✅ Account created successfully! Now logging in...
🔐 Attempting Supabase login for: admin1@beninpetro.com
✅ Login successful!
✅ User loaded from Supabase session: admin1@beninpetro.com
```

**Interface :**
- ✅ Message de succès affiché en vert
- ✅ Redirection vers le Dashboard
- ✅ Nom d'utilisateur affiché dans la sidebar
- ✅ Rôle "Admin" visible

---

### Test 2 : Connexion avec Compte Existant

**Objectif** : Vérifier que la connexion fonctionne avec un compte déjà créé

**Étapes :**
1. Se déconnecter (clic sur l'avatar → "Se déconnecter")
2. Se reconnecter avec les mêmes identifiants :
   - Email : `admin1@beninpetro.com`
   - Mot de passe : `test123456`

**Résultat Attendu :**
```
Console logs :
🔐 Attempting Supabase login for: admin1@beninpetro.com
✅ Login successful!
✅ User loaded from Supabase session: admin1@beninpetro.com
```

**Interface :**
- ✅ Connexion immédiate (pas de création de compte)
- ✅ Message de succès affiché
- ✅ Retour au Dashboard

---

### Test 3 : Persistance de Session (Rechargement Page)

**Objectif** : Vérifier que la session reste active après un rechargement

**Étapes :**
1. Se connecter avec un compte
2. Naviguer vers "Analytics" ou "Configuration"
3. Recharger la page (F5)

**Résultat Attendu :**
```
Console logs :
✅ User loaded from Supabase session: admin1@beninpetro.com
```

**Interface :**
- ✅ L'utilisateur reste connecté
- ✅ Pas de redirection vers la page de connexion
- ✅ La page actuelle est conservée

---

### Test 4 : Rôles Différents

**Objectif** : Vérifier que le système de rôle fonctionne correctement

#### Test 4A : Compte Admin
**Email** : `admin1@beninpetro.com` (chiffre à la fin)
**Attendu** : Rôle = `admin`

**Navigation visible :**
- ✅ Dashboard
- ✅ Réservations
- ✅ Analytics
- ✅ Configuration
- ✅ Reports
- ✅ Settings & Profile
- ✅ Gestion des Comptes
- ✅ Chat

#### Test 4B : Compte Contrôleur
**Email** : `ctrl1ole@beninpetro.com` (chiffre au milieu)
**Attendu** : Rôle = `controller`

**Navigation visible :**
- ✅ Dashboard
- ✅ Réservations
- ✅ Mes Réservations
- ✅ Checklist Véhicule
- ✅ Chat

#### Test 4C : Compte Utilisateur
**Email** : `user@beninpetro.com` (pas de chiffre)
**Attendu** : Rôle = `user`

**Navigation visible :**
- ✅ Réservations
- ✅ Mes Réservations
- ✅ Settings & Profile
- ✅ Chat

---

### Test 5 : Déconnexion

**Objectif** : Vérifier que la déconnexion nettoie correctement la session

**Étapes :**
1. Se connecter avec n'importe quel compte
2. Cliquer sur l'avatar en haut de la sidebar
3. Cliquer sur "Se déconnecter"

**Résultat Attendu :**
```
Console logs :
👋 Logging out...
✅ Logged out successfully
```

**Interface :**
- ✅ Redirection vers la page de connexion
- ✅ localStorage nettoyé (`supabase_session` supprimé)
- ✅ Supabase session terminée

**Vérification :**
```javascript
// Dans la console, après déconnexion :
localStorage.getItem('supabase_session') // → null
```

---

### Test 6 : Création de Réservation avec Token Supabase

**Objectif** : Vérifier que les appels API fonctionnent avec les tokens Supabase

**Étapes :**
1. Se connecter avec un compte
2. Aller sur "Réservations" ou "Dashboard"
3. Créer une nouvelle réservation :
   - Nom : Test User
   - Destination : Cotonou
   - Objet : Réunion
   - Chauffeur : Oui
   - Date de début : Aujourd'hui
   - Date de fin : Demain
   - Sélectionner un véhicule
4. Soumettre le formulaire

**Résultat Attendu :**
```
Console logs (depuis /utils/api.ts) :
📦 Checking localStorage for session...
✅ Session found! Token type: SUPABASE
✅ Token prefix: eyJhbGciOiJIUzI1NiIs...
API Call to: /reservations
Token being sent: eyJhbGciOiJIUzI1NiIs...
Response status: 200

Console logs (depuis le serveur - ligne 155+) :
========== RESERVATION CREATE REQUEST ==========
1️⃣ Authorization header: Bearer eyJhbG...
2️⃣ Extracted token: eyJhbGciOiJIUzI1NiIs...
3️⃣ Is demo token? false
4️⃣ Authentication result:
   - userId: <real-supabase-user-id>
   - error: false
5️⃣ Reservation data received: {...}
✅ Reservation saved to KV store: reservation_...
```

**Interface :**
- ✅ Message de succès
- ✅ Réservation visible dans "Mes Réservations"
- ✅ Pas d'erreur 401 Unauthorized

---

### Test 7 : Mot de Passe Incorrect

**Objectif** : Vérifier la gestion des erreurs d'authentification

**Étapes :**
1. Se déconnecter
2. Essayer de se connecter avec :
   - Email : `admin1@beninpetro.com` (compte existant)
   - Mot de passe : `wrongpassword`

**Résultat Attendu :**
```
Console logs :
🔐 Attempting Supabase login for: admin1@beninpetro.com
❌ Login failed: Invalid login credentials
```

**Interface :**
- ✅ Message d'erreur en rouge : "La connexion a échouée. Veuillez réessayer."
- ✅ Le mot de passe est vidé
- ✅ Pas de redirection

---

### Test 8 : Chat en Temps Réel

**Objectif** : Vérifier que le chat fonctionne avec l'authentification Supabase

**Étapes :**
1. Se connecter avec le compte admin
2. Aller dans "Chat"
3. Envoyer un message dans le chat général
4. Ouvrir un autre navigateur (ou navigation privée)
5. Se connecter avec un autre compte (ex: `user@beninpetro.com`)
6. Aller dans "Chat"

**Résultat Attendu :**
- ✅ Le message envoyé par l'admin est visible
- ✅ Les messages sont bien associés au bon utilisateur
- ✅ Pas d'erreur 401 lors du chargement des messages

---

### Test 9 : Gestion des Comptes (Admin)

**Objectif** : Vérifier que seuls les admins peuvent gérer les comptes

**Étapes :**
1. Se connecter avec un compte **admin**
2. Aller dans "Gestion des Comptes"
3. Vérifier que la liste des utilisateurs s'affiche

**Résultat Attendu :**
```
Console logs :
API Call to: /users
Response status: 200
```

**Interface :**
- ✅ Liste des utilisateurs Supabase affichée
- ✅ Possibilité de modifier le statut

**Test avec utilisateur non-admin :**
1. Se connecter avec `user@beninpetro.com`
2. Essayer d'accéder à "Gestion des Comptes"

**Résultat Attendu :**
- ✅ Page non accessible (pas dans la navigation)

---

## 🐛 Problèmes Courants et Solutions

### Problème 1 : "User not authenticated" lors de la création de réservation

**Cause** : Le token n'est pas transmis correctement

**Solution** :
```javascript
// Vérifier dans la console
localStorage.getItem('supabase_session')
// Si null → se reconnecter
```

---

### Problème 2 : Erreur 401 après quelques heures

**Cause** : Le token JWT a expiré

**Solution** :
- Se déconnecter et se reconnecter
- (À implémenter : refresh token automatique)

---

### Problème 3 : "Invalid login credentials" pour un nouveau compte

**Cause** : Le mot de passe est trop court (< 6 caractères)

**Solution** :
- Utiliser un mot de passe d'au moins 6 caractères

---

## 📊 Résumé des Comptes de Test

| Email | Mot de passe | Rôle | Utilisation |
|-------|--------------|------|-------------|
| `admin1@beninpetro.com` | `test123456` | Admin | Tests complets |
| `ctrl1ole@beninpetro.com` | `test123456` | Contrôleur | Tests contrôleur |
| `user@beninpetro.com` | `test123456` | Utilisateur | Tests utilisateur |
| `admin2@test.com` | `test123456` | Admin | Tests multi-comptes |

---

## ✅ Checklist de Validation Finale

Avant de considérer l'intégration Supabase comme complète, vérifier que :

- [ ] ✅ Création de compte automatique fonctionne
- [ ] ✅ Connexion avec compte existant fonctionne
- [ ] ✅ Session persiste après rechargement
- [ ] ✅ Les 3 rôles (admin, controller, user) fonctionnent
- [ ] ✅ Déconnexion nettoie la session
- [ ] ✅ Création de réservation avec token Supabase réussit
- [ ] ✅ Chat fonctionne avec les vrais tokens
- [ ] ✅ Gestion des comptes (admin uniquement)
- [ ] ✅ Messages d'erreur appropriés
- [ ] ✅ Pas d'erreur 401 Unauthorized dans les workflows normaux

---

**🎯 Une fois tous ces tests validés, l'authentification Supabase est pleinement opérationnelle !**
