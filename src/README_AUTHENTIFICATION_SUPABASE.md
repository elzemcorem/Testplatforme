# 🔐 Authentification Supabase - Guide Utilisateur

## ✨ Bienvenue sur Bénin Petro

Votre plateforme de réservation de véhicules utilise maintenant **Supabase** pour l'authentification sécurisée.

---

## 🚀 Démarrage Rapide

### Première Connexion

1. **Ouvrez la page de connexion**
2. **Entrez votre email et mot de passe** (minimum 6 caractères)
3. **Cliquez sur "Se connecter"**

➡️ **Votre compte sera créé automatiquement !** Aucune inscription préalable nécessaire.

### Exemple de Comptes

Vous pouvez utiliser ces emails pour tester différents rôles :

| Email | Rôle | Accès |
|-------|------|-------|
| `admin1@beninpetro.com` | **Admin** | Accès complet à toutes les fonctionnalités |
| `ctrl1ole@beninpetro.com` | **Contrôleur** | Gestion des réservations et checklists |
| `user@beninpetro.com` | **Utilisateur** | Création de réservations uniquement |

**Mot de passe** : Utilisez n'importe quel mot de passe (minimum 6 caractères, ex: `test123456`)

---

## 🎭 Rôles et Permissions

### 👑 Admin
**Email format** : Contient un chiffre **à la fin** (ex: `admin1@...`, `marie2@...`)

**Fonctionnalités disponibles** :
- ✅ Dashboard complet
- ✅ Gestion des réservations (validation/annulation)
- ✅ Analytics avancées
- ✅ Configuration système
- ✅ Génération de rapports
- ✅ Gestion des comptes utilisateurs
- ✅ Chat temps réel
- ✅ Gestion du parc automobile

### 🎯 Contrôleur
**Email format** : Contient un chiffre **au milieu** (ex: `ctrl1ole@...`, `ma2rie@...`)

**Fonctionnalités disponibles** :
- ✅ Dashboard
- ✅ Réservations (validation des demandes)
- ✅ Mes réservations
- ✅ Checklist véhicule (avant/après course)
- ✅ Chat temps réel

### 👤 Utilisateur
**Email format** : **Sans chiffre** (ex: `user@...`, `marie@...`)

**Fonctionnalités disponibles** :
- ✅ Créer des réservations
- ✅ Voir mes réservations
- ✅ Paramètres de profil
- ✅ Chat temps réel

---

## 📱 Fonctionnalités

### Connexion Automatique
Une fois connecté, votre session reste active même si vous :
- Fermez le navigateur
- Rechargez la page
- Ouvrez un nouvel onglet

### Déconnexion
Pour vous déconnecter :
1. Cliquez sur votre **avatar** en haut de la sidebar
2. Cliquez sur **"Se déconnecter"**

### Changement de Compte
Si vous avez plusieurs comptes :
1. Cliquez sur votre avatar
2. Sélectionnez le compte souhaité dans la liste
3. Reconnectez-vous avec les identifiants de ce compte

---

## 🔒 Sécurité

### Mots de Passe
- **Minimum 6 caractères** requis
- Les mots de passe sont **hachés et sécurisés** par Supabase
- Jamais stockés en clair

### Sessions
- Vos sessions utilisent des **tokens JWT cryptographiques**
- Les tokens expirent après quelques heures (reconnexion automatique)
- Chaque action est **authentifiée côté serveur**

### Protection des Données
- Toutes les communications sont **chiffrées** (HTTPS)
- Les données sont stockées dans **Supabase PostgreSQL**
- Accès protégé par **authentification obligatoire**

---

## ❓ Questions Fréquentes (FAQ)

### Q : Comment créer un compte ?
**R :** Aucune création manuelle nécessaire ! Entrez simplement votre email et mot de passe sur la page de connexion. Si le compte n'existe pas, il sera créé automatiquement.

### Q : Quel rôle aurai-je ?
**R :** Le rôle est déterminé automatiquement par votre email :
- Chiffre à la fin → **Admin**
- Chiffre au milieu → **Contrôleur**
- Pas de chiffre → **Utilisateur**

### Q : Puis-je changer mon mot de passe ?
**R :** Actuellement, vous devez utiliser le même mot de passe que lors de la première connexion. La fonctionnalité "Changer le mot de passe" sera ajoutée prochainement.

### Q : Ma session expire-t-elle ?
**R :** Oui, après quelques heures d'inactivité. Reconnectez-vous simplement avec vos identifiants.

### Q : Puis-je utiliser Google/Facebook pour me connecter ?
**R :** Pas encore, mais cette fonctionnalité (OAuth) sera ajoutée dans une prochaine version.

### Q : Mes données sont-elles sécurisées ?
**R :** Oui ! Bénin Petro utilise Supabase, une plateforme de niveau entreprise avec :
- Chiffrement des données
- Sauvegardes automatiques
- Conformité RGPD

---

## 🐛 Problèmes Courants

### "La connexion a échoué"
**Causes possibles** :
- Mot de passe incorrect (pour un compte existant)
- Mot de passe trop court (< 6 caractères)
- Connexion internet instable

**Solution** :
- Vérifiez votre mot de passe
- Assurez-vous d'avoir une connexion stable
- Réessayez dans quelques secondes

### "User not authenticated"
**Cause** : Votre session a expiré

**Solution** :
- Déconnectez-vous
- Reconnectez-vous avec vos identifiants

### Page blanche ou erreur
**Solution** :
1. Rechargez la page (F5)
2. Videz le cache du navigateur
3. Ouvrez la console (F12) et cherchez les erreurs

---

## 📞 Support

Pour toute question ou problème :

1. **Vérifiez la FAQ** ci-dessus
2. **Consultez les logs** (F12 → Console) pour les développeurs
3. **Contactez l'administrateur système** pour assistance

---

## 🎯 Workflow Type

### Pour un Utilisateur

```
1. Connexion avec email/password
   ↓
2. Aller dans "Réservations"
   ↓
3. Créer une réservation :
   - Nom complet
   - Destination
   - Objet du déplacement
   - Besoin d'un chauffeur ?
   - Dates de début/fin
   - Choix du véhicule
   ↓
4. Soumettre la demande
   ↓
5. Suivre l'état dans "Mes Réservations"
   ↓
6. Recevoir la validation (notification sonore)
```

### Pour un Contrôleur

```
1. Connexion avec email/password
   ↓
2. Voir les demandes dans "Réservations"
   ↓
3. Valider ou refuser une demande
   ↓
4. Remplir la checklist avant la course
   ↓
5. Finaliser la checklist après la course
```

### Pour un Admin

```
1. Connexion avec email/password
   ↓
2. Dashboard : Vue d'ensemble
   ↓
3. Analytics : Statistiques d'utilisation
   ↓
4. Gestion des comptes : Activer/désactiver utilisateurs
   ↓
5. Configuration : Gérer le parc automobile
   ↓
6. Rapports : Générer des rapports par date
```

---

## ✅ Checklist Premier Démarrage

- [ ] Je me suis connecté avec mon email
- [ ] Mon compte a été créé automatiquement
- [ ] Je vois le dashboard correspondant à mon rôle
- [ ] J'ai testé une fonctionnalité (ex: créer une réservation)
- [ ] Je me suis déconnecté et reconnecté avec succès
- [ ] J'ai vérifié que ma session persiste après rechargement

---

## 📚 Documentation Technique

Pour les développeurs, consultez :
- `/SUPABASE_INTEGRATION.md` - Architecture et intégration
- `/TESTS_SUPABASE.md` - Guide de tests complets
- `/CHANGELOG_SUPABASE.md` - Historique des modifications

---

## 🎉 Profitez de Bénin Petro !

Votre plateforme de réservation de véhicules est maintenant sécurisée par **Supabase**.

**Bon voyage ! 🚗💨**

---

*Dernière mise à jour : 15 Avril 2026*  
*Version : 2.0 - Supabase Integration*
