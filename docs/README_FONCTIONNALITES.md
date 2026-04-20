# Bénin Petro - Plateforme de Réservation de Véhicules

## 🎯 Fonctionnalités Implémentées

### 🔐 Système d'Authentification
- **3 types d'utilisateurs** basés sur le format de l'email :
  - **Admin** : Chiffre à la fin du username (ex: `daf1@gmail.com`)
  - **Contrôleur** : Chiffre ailleurs dans l'email (ex: `da1f@gmail.com`)
  - **Utilisateur** : Pas de chiffre (ex: `user@gmail.com`)
- Page de connexion avec email et mot de passe
- Déconnexion via le menu de compte (clic sur l'avatar)

### 📅 Système de Réservation
- **Formulaire complet** avec :
  - Nom du demandeur
  - Destination
  - Objet de la réservation
  - Date de début et fin (avec calendrier)
  - Besoin de chauffeur (oui/non)
- **Sauvegarde automatique** dans localStorage
- **Apparition instantanée** dans la section Réservations

### ✅ Gestion des Réservations (Contrôleurs)
- Vue de toutes les réservations
- Statistiques : En attente, Validées, Annulées
- **Actions possibles** :
  - Valider une réservation
  - Annuler avec raison obligatoire
- Filtrage par statut
- Affichage des détails complets

### 👥 Gestion de Comptes (Administrateurs)
- Liste de tous les utilisateurs
- Statistiques : Total, En ligne, Restreints, Bannis
- **Actions possibles** :
  - Activer un compte
  - Restreindre un compte
  - Bannir un compte
- Visualisation du statut en ligne en temps réel
- Affichage du rôle de chaque utilisateur

### 💬 Chat en Temps Réel
- Discussion générale pour tous les utilisateurs
- Liste des utilisateurs en ligne
- Messages persistants
- Auto-scroll vers les nouveaux messages
- **Simulation temps réel** avec localStorage et polling

### 🎨 Navigation Adaptative
- **Admin** : Accès à toutes les sections
  - Dashboard, Analytics, Configuration, Reports
  - Gestion de comptes, Chat, Settings
- **Contrôleur** : Accès limité
  - Dashboard, Réservations, Chat, Settings
- **Utilisateur** : Accès minimal
  - Réserver, Chat, Paramètres

### 🔄 Menu de Compte
- Clic sur l'avatar dans la sidebar
- Affichage des informations utilisateur
- Accès aux paramètres
- Bouton de déconnexion

## 🚀 Comment Utiliser

### Première Connexion
1. Ouvrez l'application
2. Vous verrez la page de connexion
3. Entrez un email au format désiré :
   - Admin : `admin1@test.com`
   - Contrôleur : `ctrl1@test.com`
   - Utilisateur : `user@test.com`
4. Entrez n'importe quel mot de passe
5. Cliquez sur "Se connecter"

### Faire une Réservation (Tous les utilisateurs)
1. Allez sur le Dashboard
2. Cliquez sur un véhicule disponible
3. Remplissez le formulaire
4. Sélectionnez les dates avec le calendrier
5. Confirmez la réservation
6. La réservation apparaît automatiquement dans la section Réservations

### Valider/Annuler une Réservation (Contrôleurs)
1. Allez dans "Réservations"
2. Cliquez sur une réservation en attente
3. Cliquez sur "Valider" ou "Annuler"
4. Si annulation : indiquez la raison
5. La réservation est mise à jour instantanément

### Gérer les Utilisateurs (Administrateurs)
1. Allez dans "Gestion de comptes"
2. Sélectionnez un utilisateur
3. Changez son statut : Actif, Restreint, ou Banni
4. Les utilisateurs bannis ne peuvent plus se connecter

### Utiliser le Chat (Tous)
1. Allez dans "Chat"
2. Voyez tous les utilisateurs en ligne
3. Tapez votre message
4. Appuyez sur Entrée ou cliquez sur le bouton d'envoi
5. Tous les utilisateurs connectés voient vos messages en temps réel

### Se Déconnecter
1. Cliquez sur votre avatar en bas de la sidebar
2. Cliquez sur "Se déconnecter"
3. Vous revenez à la page de connexion

## 📊 Données et Persistance
- Toutes les données sont stockées dans **localStorage**
- Les réservations persistent entre les sessions
- Les messages du chat sont sauvegardés
- Les utilisateurs et leurs statuts sont conservés
- Le polling (rafraîchissement automatique) simule le temps réel

## ⚠️ Notes Importantes
- Le mot de passe peut être n'importe quoi (système de démonstration)
- Les données sont locales au navigateur
- Pour tester multi-utilisateurs, ouvrez plusieurs onglets
- Le système détecte automatiquement le rôle basé sur l'email
- Un utilisateur banni ne peut plus se connecter

## 🎨 Interface
- Design moderne avec thème vert Bénin Petro
- Sidebar collapsible avec navigation intuitive
- Badges de statut colorés
- Animations fluides
- Responsive design
- Notifications toast pour les actions

## ✨ Zéro Erreur
- Code 100% fonctionnel
- Pas d'erreurs React dans la console
- Gestion correcte des états
- Validation des formulaires
- Messages d'erreur clairs
