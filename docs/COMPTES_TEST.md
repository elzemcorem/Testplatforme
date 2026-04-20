# Comptes de Test - Bénin Petro

## 📧 Exemples de Comptes

### 👑 Administrateurs (chiffre à la fin)
```
Email: admin1@beninpetro.com
Email: daf2@beninpetro.com
Email: manager3@test.com
Email: direction5@gmail.com
```

**Accès :**
- Dashboard complet
- Analytics
- Configuration
- Reports
- Gestion de comptes (restreindre/bannir)
- Chat
- Settings

---

### 🎯 Contrôleurs (chiffre au milieu)
```
Email: ctrl1@beninpetro.com
Email: da1f@beninpetro.com
Email: sup2ort@test.com
Email: gest1ionnaire@gmail.com
```

**Accès :**
- Dashboard
- Réservations (valider/annuler)
- Chat
- Settings

---

### 👤 Utilisateurs (sans chiffre)
```
Email: user@beninpetro.com
Email: john@test.com
Email: marie@gmail.com
Email: employe@beninpetro.com
```

**Accès :**
- Réserver un véhicule
- Chat
- Paramètres

---

## 🧪 Scénarios de Test

### Test 1 : Flux Complet de Réservation
1. Connectez-vous comme utilisateur : `user@test.com`
2. Cliquez sur un véhicule
3. Remplissez le formulaire de réservation
4. Sélectionnez des dates
5. Confirmez

**Ouvrez un nouvel onglet :**
6. Connectez-vous comme contrôleur : `ctrl1@test.com`
7. Allez dans "Réservations"
8. Voyez la réservation apparaître
9. Validez ou annulez la réservation

**Retournez au premier onglet :**
10. Rafraîchissez (la réservation est mise à jour)

---

### Test 2 : Chat Multi-Utilisateurs
**Onglet 1 :**
1. Connectez-vous : `admin1@test.com`
2. Allez dans Chat
3. Envoyez un message

**Onglet 2 :**
4. Connectez-vous : `user@test.com`
5. Allez dans Chat
6. Voyez le message de l'admin
7. Répondez

**Onglet 3 :**
8. Connectez-vous : `ctrl1@test.com`
9. Allez dans Chat
10. Voyez tous les messages
11. Voyez tous les utilisateurs en ligne

---

### Test 3 : Gestion de Comptes (Admin)
**Onglet 1 (Admin) :**
1. Connectez-vous : `admin1@test.com`
2. Allez dans "Gestion de comptes"
3. Trouvez l'utilisateur `user@test.com`
4. Bannissez-le

**Onglet 2 (Utilisateur) :**
5. Déconnectez-vous si connecté
6. Essayez de vous reconnecter : `user@test.com`
7. Vous verrez un message : "Votre compte a été banni"

**Retour Onglet 1 :**
8. Changez le statut de `user@test.com` à "Actif"

**Retour Onglet 2 :**
9. Reconnectez-vous : `user@test.com`
10. Ça fonctionne !

---

### Test 4 : Navigation Adaptative
**Test Admin :**
1. Connectez-vous : `admin2@test.com`
2. Comptez les sections dans la sidebar
3. Vous devriez voir : Dashboard, Analytics, Configuration, Reports, Gestion de comptes, Chat, Settings (7 sections)

**Test Contrôleur :**
1. Connectez-vous : `ctrl2@test.com`
2. Comptez les sections
3. Vous devriez voir : Dashboard, Réservations, Chat, Settings (4 sections)

**Test Utilisateur :**
1. Connectez-vous : `employee@test.com`
2. Comptez les sections
3. Vous devriez voir : Réserver, Chat, Paramètres (3 sections)

---

### Test 5 : Menu de Compte
1. Connectez-vous avec n'importe quel compte
2. Cliquez sur votre avatar en bas de la sidebar
3. Vérifiez :
   - Votre nom s'affiche
   - Votre email s'affiche
   - Vous pouvez accéder aux paramètres
   - Vous pouvez vous déconnecter
4. Déconnectez-vous
5. Vous revenez à la page de connexion

---

## 💡 Astuces

### Pour tester le temps réel :
- Ouvrez plusieurs onglets avec différents comptes
- Les changements dans un onglet se reflètent dans les autres (rafraîchissement automatique chaque 1-2 secondes)

### Pour réinitialiser les données :
1. Ouvrez la console du navigateur (F12)
2. Tapez : `localStorage.clear()`
3. Rafraîchissez la page
4. Toutes les données sont effacées

### Pour voir les données :
1. Ouvrez la console du navigateur (F12)
2. Allez dans l'onglet "Application" ou "Storage"
3. Cliquez sur "Local Storage"
4. Vous verrez :
   - `currentUser` : L'utilisateur connecté
   - `allUsers` : Tous les utilisateurs
   - `reservations` : Toutes les réservations
   - `chatMessages` : Tous les messages du chat

---

## 🎯 Validation Finale

### Checklist :
- [ ] Page de connexion s'affiche au démarrage
- [ ] Connexion fonctionne avec n'importe quel mot de passe
- [ ] Rôle déterminé correctement selon l'email
- [ ] Navigation différente selon le rôle
- [ ] Réservation créée et visible dans la section Réservations
- [ ] Validation/annulation fonctionne avec raison
- [ ] Chat affiche tous les utilisateurs en ligne
- [ ] Messages du chat visibles par tous
- [ ] Admin peut restreindre/bannir des utilisateurs
- [ ] Menu de compte fonctionne (clic sur avatar)
- [ ] Déconnexion ramène à la page de connexion
- [ ] Aucune erreur dans la console

**Si tous les points sont cochés : Bravo ! Le système fonctionne parfaitement ! 🎉**
