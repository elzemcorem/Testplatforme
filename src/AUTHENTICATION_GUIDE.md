# Guide d'Authentification - Bénin Petro

## Système d'authentification par email

La plateforme utilise un système d'authentification basé sur le format de l'email pour déterminer le rôle de l'utilisateur.

### Types d'utilisateurs

#### 1. Administrateur
- **Format email** : Chiffre à la fin du username (avant le @)
- **Exemples** : 
  - `daf1@gmail.com`
  - `admin2@beninpetro.com`
  - `manager3@example.com`
- **Accès** :
  - Dashboard
  - Analytics
  - Configuration
  - Reports
  - Gestion de comptes (restriction/bannissement)
  - Chat
  - Settings

#### 2. Contrôleur
- **Format email** : Chiffre ailleurs dans le username (pas à la fin)
- **Exemples** :
  - `da1f@gmail.com`
  - `ctrl2user@beninpetro.com`
  - `a1bc@example.com`
- **Accès** :
  - Dashboard
  - Réservations (validation/annulation)
  - Chat
  - Settings

#### 3. Utilisateur
- **Format email** : Aucun chiffre dans le username
- **Exemples** :
  - `user@gmail.com`
  - `john@beninpetro.com`
  - `marie@example.com`
- **Accès** :
  - Réserver un véhicule
  - Chat
  - Paramètres

### Fonctionnalités

#### Réservations
- Les utilisateurs peuvent créer des réservations
- Les contrôleurs peuvent valider ou annuler les réservations
- Lors de l'annulation, une raison doit être fournie

#### Chat en temps réel
- Tous les utilisateurs connectés peuvent voir et discuter entre eux
- Simulé avec localStorage et polling pour le temps réel

#### Gestion de comptes (Admin uniquement)
- Voir tous les comptes
- Restreindre ou bannir des utilisateurs
- Voir qui est en ligne

### Notes
- Le mot de passe peut être n'importe quoi (système de démo)
- Les données sont stockées dans localStorage
- Refresh la page pour voir les mises à jour en temps réel
