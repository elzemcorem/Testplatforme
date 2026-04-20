# 🗓️ Système de Réservations Futures - Documentation Complète

## Vue d'ensemble

Un système intelligent et flexible pour permettre aux utilisateurs de réserver des véhicules **à l'avance** pour des durées de **jours, semaines ou mois**.

### Points clés:
✅ **Tous les utilisateurs connectés** peuvent faire des futures bookings  
✅ Les véhicules restent **disponibles et réservables** jusqu'au jour d'utilisation  
✅ **Interface intuitive** avec calendrier et durées prédéfinies  
✅ **Validation automatique** des conflits de réservation  
✅ **Visibilité** des dates non disponibles pour tous les utilisateurs  

---

## Changements Implémentés

### 1. 🗄️ Base de Données (SQL)

#### Nouvelle Policy RLS
```sql
-- Permet à tous les utilisateurs de voir les futures bookings pour vérifier la disponibilité
DROP POLICY IF EXISTS "Users can view all future bookings for availability" ON future_bookings;
CREATE POLICY "Users can view all future bookings for availability" ON future_bookings
  FOR SELECT USING (status != 'cancelled');
```

Cette policy permet:
- De voir **tous** les futures bookings non annulés
- De vérifier quelles dates sont disponibles/occupées
- De recevoir des avertissements en cas de conflit

### 2. 🎨 Composants Frontend

#### A. `FutureBookingForm.tsx` - Formulaire de réservation intelligent

**Fonctionnalités:**
- 📅 **Sélection de date de début** avec calendrier
- ⏱️ **Durée rapide** (1 jour, 1 semaine, 1 mois, 3 mois)
- 🔧 **Durée personnalisée** (jours/semaines/mois)
- 📝 **Notes optionnelles** pour décrire le besoin
- ✅ **Validation automatique** des dates
- 🚨 **Détection de conflits** avec réservations existantes
- 📊 **Affichage visuel** de la période réservée

**Utilisation:**
```tsx
<FutureBookingForm
  isOpen={isOpen}
  onClose={handleClose}
  vehicleName="Peugeot 307"
  vehicleId="uuid-here"
  onSuccess={reloadData}
/>
```

#### B. `FutureBookingsPage.tsx` - Page de gestion des futures bookings

**Sections:**
1. **Grille des véhicules disponibles**
   - Affiche tous les véhicules
   - Barre de progression d'utilisation
   - Nombre de réservations actives
   - Bouton pour réserver

2. **Tableau des réservations de l'utilisateur**
   - Liste toutes les futures bookings
   - Affiche les dates de début/fin
   - Durée totale en jours
   - Statut avec badge coloré
   - Bouton d'annulation (avant la date de début)

3. **Gestion des réservations**
   - Annuler une réservation (avant le début)
   - Consulter les détails
   - Actualiser les données

**Statuts disponibles:**
- 🟡 **Pending** - En attente
- 🟢 **Confirmed** - Confirmée
- 🔵 **Started** - Commencée
- ⚫ **Completed** - Terminée
- ❌ **Cancelled** - Annulée

#### C. `FutureBookingsGuide.tsx` - Guide d'utilisation

Aide complète incluant:
- Qu'est-ce qu'une réservation future?
- Avantages et bénéfices
- Étapes pour créer une réservation
- Options de durée disponibles
- Statuts des réservations
- FAQ

### 3. 🛣️ Routes et Navigation

#### Ajout dans le Layout (`Layout.tsx`)
```tsx
case "future-bookings":
  return <FutureBookingsPage />;
```

**Disponible pour tous les rôles:**
- 👤 Utilisateurs normaux
- 🔧 Contrôleurs
- 🏢 Admins
- 📊 DAF

#### Menu Sidebar (`Sidebar.tsx`)

Ajout pour **tous les rôles**:
```tsx
{
  id: "future-bookings",
  name: "Réservations Futures",
  icon: Calendar,
  description: "Réserver à l'avance"
}
```

### 4. 🔧 Services

#### Services utilisés:
- **`futureBookingsService`** - Gestion des futures bookings
  - `createFutureBooking()` - Créer une réservation
  - `cancelFutureBooking()` - Annuler une réservation
  - `getAllFutureBookings()` - Récupérer tous les bookings
  - `checkBookingConflict()` - Vérifier les conflits

- **`vehicleService`** - Gestion des véhicules
  - `loadVehicles()` - Charger la liste des véhicules

---

## Flux Utilisateur

### Créer une future booking

```
1. Cliquer sur "Réservations Futures" dans le menu
   ↓
2. Sélectionner un véhicule
   ↓
3. Choisir la date de début
   ↓
4. Sélectionner la durée (rapide ou personnalisée)
   ↓
5. Ajouter des notes (optionnel)
   ↓
6. Cliquer sur "Réserver"
   ↓
7. Réservation créée avec le statut "pending"
   ↓
8. Apparaît dans "Mes réservations futures"
```

### Visualiser les disponibilités

```
- Grille des véhicules: barre de progression montre l'utilisation
- Futures bookings de tous les utilisateurs visibles
- Dates occupées = non réservables par d'autres
- Dates libres = réservables par quiconque
```

### Annuler une réservation

```
1. Aller à "Mes réservations futures"
   ↓
2. Trouver la réservation (avant sa date de début)
   ↓
3. Cliquer sur l'icône de suppression
   ↓
4. Confirmer l'annulation
   ↓
5. Le véhicule est à nouveau disponible
```

---

## Architecture Technique

### Structure des données

**Table: `future_bookings`**
```sql
id (UUID)                    -- Identifiant unique
user_id (UUID)              -- Utilisateur qui a réservé
vehicle_id (UUID)           -- Véhicule réservé
planned_start_date (TIMESTAMP) -- Date de début
planned_end_date (TIMESTAMP)   -- Date de fin
status (TEXT)               -- pending, confirmed, cancelled, etc.
notes (TEXT)                -- Notes optionnelles
created_at (TIMESTAMP)      -- Création
updated_at (TIMESTAMP)      -- Dernière mise à jour
```

### RLS Policies

| Policy | Target | Condition |
|--------|--------|-----------|
| "Users can view their own" | SELECT | `user_id = auth.uid()` |
| "Users can create their own" | INSERT | `user_id = auth.uid()` |
| "Users can update their own" | UPDATE | `user_id = auth.uid()` |
| "Users can view all for availability" | SELECT | `status != 'cancelled'` |

---

## Avantages du Système

### Pour les utilisateurs
✅ Planification à long terme  
✅ Flexibilité de durée (1 jour → plusieurs mois)  
✅ Garantie de disponibilité du véhicule  
✅ Visibilité sur les dates disponibles  
✅ Annulation facile avant le début  

### Pour l'organisation
✅ Meilleure utilisation des ressources  
✅ Prévention des conflits  
✅ Traçabilité des réservations  
✅ Planification optimisée  
✅ Partage équitable des véhicules  

---

## Validation et Sécurité

### Validations côté client
- ✅ Dates valides (fin > début)
- ✅ Dates futures uniquement
- ✅ Durée > 0
- ✅ Utilisateur authentifié

### Validations côté serveur (Supabase)
- ✅ RLS policies restrictives
- ✅ Vérification des conflits
- ✅ Intégrité des données
- ✅ Constraints de table

### Contrôle d'accès
- Chaque utilisateur voit ses propres réservations
- Tous voient les dates disponibles
- Les annulations nécessitent l'autorisation

---

## Déploiement

### Étapes:

1. **Exécuter le SQL** dans Supabase SQL Editor:
   ```bash
   - Copier le contenu de SETUP_COMPLET_ALL_IN_ONE.sql
   - Exécuter dans l'éditeur SQL de Supabase
   ```

2. **Redémarrer l'application**
   ```bash
   npm run dev
   ```

3. **Tester les fonctionnalités**
   - Créer une future booking
   - Vérifier les conflits
   - Annuler une réservation
   - Voir les statuts

---

## FAQ

**Q: Un utilisateur peut-il réserver le même véhicule deux fois?**
R: Oui, pour des périodes différentes sans conflit.

**Q: Que se passe-t-il à la date de début?**
R: Le statut passe automatiquement à "started", puis "completed" à la fin.

**Q: Peut-on modifier une réservation?**
R: Non directement. Annuler et recréer une nouvelle.

**Q: Limite de durée?**
R: Aucune limite fixe. Jusqu'à 120 mois configurés.

**Q: Les non-authentifiés peuvent-ils voir les réservations?**
R: Non, RLS protect tout.

---

## Support et Troubleshooting

### Erreur: "Il existe déjà une réservation pour cette période"
- Vérifier les autres bookings non annulés
- Attendre que la période précédente se termine
- Choisir des dates différentes

### La page de futures bookings est vide
- Vérifier la connexion utilisateur
- Rechargement de la page (F5)
- Vérifier la base de données dans Supabase

### Impossible d'annuler une réservation
- Vérifier que la date n'a pas commencé
- Vérifier que ce n'est pas "Completed"
- Contacter l'administrateur

---

**Version:** 1.0  
**Dernière mise à jour:** 2026-04-20  
**Statut:** ✅ Production Ready
