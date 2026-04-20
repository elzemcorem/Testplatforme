# Guide de test - Gestion des comptes de session

## Contexte
Nouvelle intégration de gestion des comptes de session:
- Les utilisateurs ne voient que les comptes ajoutés pendant leur session
- Possibilité de sauvegarder des comptes pour les prochaines sessions
- Changement rapide entre les comptes
- Nettoyage automatique des comptes temporaires à la déconnexion

## Architecture Implémentée

### Services
- **SessionAccountsManager**: Gère les comptes temporaires (sessionStorage) et sauvegardés (localStorage)
- **AuthContext**: Charge les comptes de session et ajoute l'utilisateur courant à la session

### Composants
- **AddAccountModal**: Modal pour ajouter des comptes autorisés à la session
- **Sidebar**: Menu profil avec liste de comptes et options sauvegarder/supprimer

### Stockage
- **sessionStorage**: Comptes temporaires (disparaissent à la fermeture du navigateur)
- **localStorage**: Comptes sauvegardés (persistent entre les sessions)

---

## TESTS À EFFECTUER

### 1️⃣ Test de Connexion Initiale

**Objectif**: Vérifier qu'une session commence avec un seul compte (l'utilisateur actuel)

**Étapes**:
1. Effacer le navigateur cache/cookies (Ctrl+Shift+Delete)
2. Accéder à l'application
3. Se connecter avec un compte autorisé (ex: daf@beninpetro.com)
4. Ouvrir le menu profil (cliquer sur l'avatar en bas du sidebar)

**Attendu**:
- ✅ Seul le compte actuel visible dans le menu
- ✅ Pas d'autres comptes affichés
- ✅ Bouton "Ajouter un compte" disponible

**Dépannage si échoué**:
- Vérifier console: `sessionStorage` doit contenir le compte actuel
- Vérifier localStorage: `saved_accounts` peut exister d'une session précédente

---

### 2️⃣ Test d'Ajout d'un Compte

**Objectif**: Ajouter un nouveau compte à la session courante

**Étapes**:
1. Dans le menu profil, cliquer sur "Ajouter un compte"
2. Entrer un email autorisé (ex: controller@beninpetro.com)
3. Cliquer "Ajouter le compte"
4. Attendre le message de confirmation

**Attendu**:
- ✅ Modal s'ouvre
- ✅ Email est validé contre la table `allowed_users`
- ✅ Toast "Compte ajouté à la session!" apparaît
- ✅ Le nouveau compte apparaît dans le menu profil

**Dépannage si échoué**:
- Vérifier que l'email existe dans la table `allowed_users` Supabase
- Vérifier console pour les erreurs d'API
- Vérifier localStorage sessionStorage: nouveau compte doit être ajouté

---

### 3️⃣ Test de Sauvegarde de Compte

**Objectif**: Sauvegarder un compte pour les prochaines sessions

**Étapes**:
1. Dans le menu profil, survoler un compte ajouté (pas le compte actuel)
2. Cliquer sur l'icône 💾 (Save)
3. Vérifier que l'icône change en 🗑️ (Trash)
4. Toast "✓ Compte sauvegardé" doit apparaître

**Attendu**:
- ✅ Icône change de 💾 à 🗑️
- ✅ Toast de confirmation s'affiche
- ✅ Compte est marqué comme sauvegardé en localStorage

**Dépannage si échoué**:
- Vérifier console: `localStorage` doit contenir `saved_accounts`
- Vérifier les icônes lucide-react chargées correctement

---

### 4️⃣ Test de Suppression de Sauvegarde

**Objectif**: Cesser de sauvegarder un compte

**Étapes**:
1. Dans le menu profil, survoler un compte sauvegardé (icône 🗑️ visible)
2. Cliquer sur l'icône 🗑️
3. Toast "✓ Compte non sauvegardé" doit apparaître
4. Icône revient à 💾

**Attendu**:
- ✅ Icône revient à 💾
- ✅ Toast confirme suppression
- ✅ Le compte est toujours visible cette session
- ✅ Ne sera plus visible après logout/login

---

### 5️⃣ Test de Changement de Compte

**Objectif**: Basculer entre les comptes ajoutés

**Étapes**:
1. Dans le menu profil, cliquer sur un compte différent du compte actuel
2. Le modal "Changement de compte" doit demander le mot de passe
3. Entrer le mot de passe du compte cible
4. Attendre la déconnexion/reconnexion

**Attendu**:
- ✅ Avatar change au compte sélectionné
- ✅ Nom du compte change dans le header
- ✅ Rôle change si applicable
- ✅ Les données affichées correspondent au nouveau compte

**Dépannage si échoué**:
- Vérifier que le mot de passe est correct
- Vérifier la console pour les erreurs d'authentification
- Vérifier que `switchAccount()` fonctionne dans AuthContext

---

### 6️⃣ Test de Logout/Login

**Objectif**: Vérifier que les comptes temporaires sont effacés mais les sauvegardés persistent

**Étapes Avec Session Sauvegardée**:
1. Ajouter un compte et le sauvegarder (💾 → 🗑️)
2. Ajouter un deuxième compte SANS le sauvegarder
3. Menu profil doit montrer 3 comptes: courant + 2 ajoutés
4. Se déconnecter (cliquer sur "Se déconnecter")
5. Se reconnecter avec le même ou un autre compte

**Attendu**:
- ✅ Seul le compte actuel visible après reconnexion
- ✅ Les comptes temporaires ont disparu
- ✅ Le compte sauvegardé RE-APPARAÎT dans le menu
- ✅ localStorage `saved_accounts` a une seule entrée

**Dépannage si échoué**:
- Vérifier que `logout()` appelle `SessionAccountsManager.clearSessionAccounts()`
- Vérifier sessionStorage vidé après logout
- Vérifier localStorage conserve les comptes sauvegardés

---

### 7️⃣ Test du Dashboard DAF

**Objectif**: Vérifier que le Dashboard DAF s'affiche correctement et en temps réel

**Étapes**:
1. Se connecter avec un compte DAF (daf@beninpetro.com)
2. Naviguer vers "Dashboard DAF"
3. Attendre le chargement initial

**Attendu**:
- ✅ Le header "Dashboard DAF" s'affiche
- ✅ Les 5 cartes de stats chargent (Validées, Annulées, Modifiées, Planifiées, En attente)
- ✅ Le calendrier s'affiche
- ✅ Le tableau "Réservations planifiées" s'affiche avec colonnes correctes
- ✅ Icône WiFi ✓ indique connexion Realtime établie

**Dépannage si échoué**:
- Ouvrir DevTools → Console pour chercher erreurs
- Vérifier que les tables `future_bookings` et `controller_actions` existent en Supabase
- Vérifier que les RLS policies permettent la lecture aux DAF
- Réactiver les policies SQL si nécessaire

---

### 8️⃣ Test des Contrôleurs (PGRST116)

**Objectif**: Vérifier que les contrôleurs peuvent valider/refuser des réservations futures

**Étapes**:
1. Se connecter avec un compte contrôleur
2. Naviguer vers "Réservations futures"
3. Créer une nouvelle réservation future (ou utiliser une existante)
4. Cliquer sur "Valider" ou "Refuser"
5. Vérifier que le statut change

**Attendu**:
- ✅ Boutons "Valider" et "Refuser" visibles pour contrôleur
- ✅ Clic sur "Valider" → Status devient "confirmed"
- ✅ Clic sur "Refuser" → Status devient "cancelled"
- ✅ Pas d'erreur PGRST116 dans console
- ✅ Le changement de statut apparaît en temps réel sur le DAF

**Dépannage si échoué**:
- Vérifier que `FIX_RLS_ROLE_CHECK.sql` a été exécutée en Supabase
- Vérifier que `updateFutureBookingStatus()` s'exécute correctement
- Vérifier les logs Supabase pour les erreurs RLS

---

### 9️⃣ Test des Réservations Normales

**Objectif**: Vérifier qu'les réservations normales fonctionnent encore

**Étapes**:
1. Se connecter avec un compte utilisateur normal
2. Naviguer vers "Réservations"
3. Essayer de créer une nouvelle réservation
4. Sélectionner un véhicule, dates, et cliquer "Réserver"

**Attendu**:
- ✅ Formulaire se soumet sans erreur
- ✅ Réservation créée et apparaît dans la liste
- ✅ Pas d'erreur 403 ou RLS

**Dépannage si échoué**:
- Vérifier que `FIX_RESERVATIONS_POLICIES.sql` a été exécutée
- Vérifier que la politique CREATE pour les utilisateurs existe
- Consulter les logs Supabase

---

### 🔟 Test des Responsive (Mobile)

**Objectif**: Vérifier que tout fonctionne sur mobile

**Étapes**:
1. Ouvrir DevTools (F12) → Responsive Design Mode (Ctrl+Shift+M)
2. Sélectionner "iPhone 12" (390px width)
3. Se connecter et tester les étapes 1-5 ci-dessus
4. Naviguer vers DAF Dashboard

**Attendu**:
- ✅ Sidebar responsive reste fonctionnel
- ✅ Menu profil accessible et utilisable
- ✅ Modal "Ajouter un compte" lisible
- ✅ Dashboard DAF a padding correct
- ✅ Tableaux scrollable horizontalement
- ✅ Pas de débordement de contenu

---

## CHECKLIST FINALE

- [ ] Connexion initiale - seul compte visible
- [ ] Ajout d'un compte fonctionne
- [ ] Sauvegarde d'un compte fonctionne
- [ ] Suppression de sauvegarde fonctionne
- [ ] Changement de compte fonctionne
- [ ] Logout/Login conserve les comptes sauvegardés
- [ ] DAF Dashboard s'affiche correctement
- [ ] Contrôleurs peuvent valider/refuser
- [ ] Réservations normales fonctionnent
- [ ] Responsive design OK sur mobile

---

## NOTES IMPORTANTES

### Profils de Test Recommandés

**Pour tester comptes utilisateurs normaux**:
- admin@beninpetro.com (admin)
- controller@beninpetro.com (controller)
- daf@beninpetro.com (daf)
- user1@beninpetro.com (user)
- user2@beninpetro.com (user)

**Points à vérifier dans les logs**:
```javascript
// Console du navigateur doit afficher:
🔄 Loading session and saved accounts...
✅ N session/saved accounts loaded
✅ Current user added to session: email@example.com
```

### Cas d'Edge Problématiques à Tester

1. **Ajouter le même compte deux fois**: Doit être idempotent (pas de doublon)
2. **Ajouter compte inexistant**: Affiche erreur "Email non autorisé"
3. **Sauvegarder 5+ comptes**: localStorage peut avoir limites (5-10MB)
4. **Accès offline**: Fallback à polling pour Realtime

### Performance à Monitorer

- Temps de chargement du DAF Dashboard (doit être < 2 secondes)
- Nombre de requêtes réseau au login (doit être minimal)
- Mémoire sessionStorage utilisée (doit rester < 1MB)

---

## FAQ

**Q**: Comment voir le contenu de sessionStorage?
**R**: F12 → Application → Session Storage → Sélectionner le domaine

**Q**: Comment réinitialiser tous les comptes?
**R**: Lancer dans console: `sessionStorage.clear(); localStorage.clear();`

**Q**: Pourquoi mon compte ajouté n'apparaît pas?
**R**: Vérifier que l'email est dans la table `allowed_users` Supabase

**Q**: Comment tester sans se déconnecter?
**R**: Ouvrir deux onglets: l'un pour tester logout, l'autre pour contrôler
