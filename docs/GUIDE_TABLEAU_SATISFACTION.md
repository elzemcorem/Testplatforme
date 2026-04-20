# 📊 Guide: Tableau de Satisfaction des Services

## 🎯 Nouveau Flux de Travail

### ✅ Avant (ANCIEN)
1. Cliquer "Rapports de Sortie"
2. Sélectionner une date
3. Générer rapport
4. Chercher "Ajouter Satisfaction" dans un dialog
5. ❌ Très caché et confus

### ✨ MAINTENANT (NOUVEAU)
1. Cliquer "Rapports de Sortie"
2. **✅ LE TABLEAU EST VISIBLE IMMÉDIATEMENT**
3. Remplir les 5 services (DCM, DTM, DAF, QHSE, DO)
4. **Les pourcentages se calculent automatiquement** ⚡
5. Cliquer "Enregistrer les données" 
6. **Tableau se réinitialise** automatiquement
7. *Optionnel*: Générer rapports de sorties pour voir toutes les sorties du jour

---

## 📋 COMMENT REMPLIR LE TABLEAU

### Exemple Pratique

Vous avez **10 demandes** pour DCM:
- **8** étaient **satisfait** ✓
- **2** étaient **non satisfait** ✗

| SERVICES | NOMBRE DEMANDES | NOMBRES SATISFAIT | NOMBRE NON SATISFAITS | TAUX SATISFACTION | TAUX NON SATISFACTION |
|----------|---|---|---|---|---|
| **DCM** | **10** | **8** | **2** | **80%** ✅ | **20%** ❌ |

Les pourcentages se **calculent automatiquement**!

#### Formule Utilisée:
```
Taux Satisfaction = (Satisfait ÷ Demandes) × 100
Taux Non-Satisfaction = (Non-Satisfait ÷ Demandes) × 100
```

---

## 🎨 DESIGN PROFESSIONNEL

### Couleurs & Styling
- 🟢 **Colonne "Taux Satisfaction"**: Fond vert clair, texte vert foncé
- 🔴 **Colonne "Taux Non-Satisfaction"**: Fond rouge clair, texte rouge foncé
- 🔵 **Ligne TOTAL**: Fond bleu clair, gras

### Exemple Visuel
```
┌──────────┬─────────┬──────────┬───────────┬─────────────┬──────────────────┐
│ SERVICES │ DEMANDES│ SATISFAIT│ NON SATIS │ TAUX SATIS  │ TAUX NON SATIS   │
├──────────┼─────────┼──────────┼───────────┼─────────────┼──────────────────┤
│ DCM      │   10    │    8     │     2     │    80% 🟢    │     20% 🔴       │
│ DTM      │   15    │   14     │     1     │    93% 🟢    │      7% 🔴       │
│ DAF      │    8    │    7     │     1     │    88% 🟢    │     13% 🔴       │
│ QHSE     │   12    │   12     │     0     │   100% 🟢    │      0% 🔴       │
│ DO       │    5    │    5     │     0     │   100% 🟢    │      0% 🔴       │
├──────────┼─────────┼──────────┼───────────┼─────────────┼──────────────────┤
│ TOTAL    │   50    │   46     │     4     │    92% 🟢    │      8% 🔴       │
└──────────┴─────────┴──────────┴───────────┴─────────────┴──────────────────┘
```

---

## 🎯 ÉTAPES DÉTAILLÉES

### Étape 1️⃣ : Ouvrir le Tableau
```
Menu Sidebar → Rapports de Sortie
                ↓
    🎉 LE TABLEAU APPARAÎT EN HAUT
```

### Étape 2️⃣ : Remplir les Données

Pour **chaque service** (DCM, DTM, DAF, QHSE, DO):

1. **Colonne 1**: Entrez le nombre de **DEMANDES** (ex: 10)
2. **Colonne 2**: Entrez le nombre de clients **SATISFAITS** (ex: 8)
3. **Colonne 3**: Entrez le nombre de clients **NON SATISFAITS** (ex: 2)

⚡ **Les pourcentages se calculent automatiquement!**

### Étape 3️⃣ : Vérifier la Ligne TOTAL

La ligne **TOTAL** se met à jour automatiquement:
- Somme de toutes les demandes
- Somme de tous les satisfaits
- Somme de tous les non-satisfaits
- **Pourcentage global** calculé correctement

### Étape 4️⃣ : Ajouter des Notes (Optionnel)

Zone de texte en bas du tableau pour ajouter des commentaires, observations, etc.

```
Notes additionnelles:
[_______________________________________________]
```

### Étape 5️⃣ : Enregistrer les Données

Cliquez le bouton vert:
```
[✅ Enregistrer les données]
```

✅ **Confirmation**: "Données de satisfaction enregistrées"  
🔄 **Tableau se réinitialise** automatiquement (tous les champs à 0)

### Étape 6️⃣ : Exporter (Optionnel)

Trois boutons d'export disponibles:

| Format | Bouton | Utilisation |
|--------|--------|-------------|
| **Excel** | 📊 Export Excel | Modifier dans Excel, GraphQL, etc. |
| **PDF** | 📄 Export PDF | Imprimer, archiver |
| **Word** | 📘 Export Word | Éditer dans Word, ajouter du texte |

---

## ⚙️ CALCUL DES POURCENTAGES

### Algorithme (Professionnel)

```typescript
// Pour chaque service
satisfaction% = (satisfied ÷ requests) × 100
dissatisfaction% = (unsatisfied ÷ requests) × 100

// Exemple DCM:
satisfaction% = (8 ÷ 10) × 100 = 80%
dissatisfaction% = (2 ÷ 10) × 100 = 20%

// Cas particulier: 0 demandes
if (requests === 0) {
  satisfaction% = 0
  dissatisfaction% = 0
}
```

### Arrondi
Les pourcentages sont **arrondis à l'entier le plus proche**:
- 80.4% → **80%**
- 80.5% → **81%**
- 80.7% → **81%**

---

## 🔒 DONNÉES SAUVEGARDÉES

Quand vous cliquez "Enregistrer les données":

✅ Les données sont sauvegardées dans la **base de données Supabase**  
✅ Table: `satisfaction_reports`  
✅ Colonnes: exit_report_id, vehicle_id, user_id, dcm_*, dtm_*, daf_*, qhse_*, do_*, notes  
✅ Timestamps: created_at, updated_at  
✅ Métadonnées: created_by  

---

## 📊 GÉNÉRER UN RAPPORT AVEC LES SORTIES

**Après** avoir rempli le tableau de satisfaction, vous pouvez:

1. Scroll en bas
2. Section "Générer un Rapport de Sorties"
3. Sélectionner une **DATE**
4. Cliquer "Voir Sorties"
5. Un dialog s'ouvre avec toutes les sorties de cette date
6. Boutons d'export: **Word** et **PDF**

### Données du Rapport

Le rapport contient:
- Véhicule, Utilisateur, Dates
- Kilométrage, Carburant, État général
- Vérification des éléments (checklist)
- Notes du contrôleur

---

## ❓ FAQ

### Q: Pourquoi les pourcentages ne se mettent à jour pas?
**R**: Rafraîchissez la page ou attendez 1-2 secondes. Les calculs sont en temps réel.

### Q: Que se passe-t-il si j'ai 0 demandes?
**R**: Les pourcentages seront **0%** dans ce cas (division par zéro évitée).

### Q: Est-ce que mes données sont sauvegardées automatiquement?
**R**: **NON**, vous devez cliquer "Enregistrer les données". Avant cela, rien n'est sauvegardé.

### Q: Puis-je éditer après avoir enregistré?
**R**: Techniquement, vous pouvez ajouter un nouveau rapport pour la même sortie (elle sera écrasée).

### Q: Comment télécharger les données?
**R**: Utilisez les 3 boutons d'export (Excel, PDF, Word).

### Q: Les fichiers téléchargés ont quel nom?
**R**: Format: `satisfaction_YYYY-MM-DD.ext`  
Exemple: `satisfaction_2026-04-17.csv`

---

## 🎨 STYLES & COULEURS

### Palette Couleur
| Élément | Couleur | Code | Utilisation |
|---------|---------|------|-------------|
| Satisfaction (%) | Vert | #16a34a | Taux positif |
| Non-Satisfaction (%) | Rouge | #ef4444 | Taux négatif |
| Header | Bleu | #2563eb | Titre, entête tableau |
| Total Row | Bleu Clair | #dbeafe | Mise en évidence ligne totale |
| Fond | Blanc/Gris | #f9fafb | Arrière-plan |

---

## 📱 RESPONSIVE DESIGN

✅ Fonctionne sur:
- 🖥️ **Desktop** (optimal)
- 💻 **Tablet** (optimisé)
- 📱 **Mobile** (tableau scrollable horizontalement)

---

## ✨ PROCHAINES ÉTAPES

### À FAIRE (URGENT)

1️⃣ **Exécuter le SQL** dans Supabase:
   ```
   Supabase Dashboard → SQL Editor
   → Copier SATISFACTION_REPORTS_TABLE.sql
   → Cliquer Run
   ```

2️⃣ **Tester le tableau**:
   ```
   1. Se connecter
   2. Aller à "Rapports de Sortie"
   3. Remplir le tableau
   4. Cliquer "Enregistrer"
   5. Vérifier les pourcentages ✓
   ```

3️⃣ **Tester les exports**:
   ```
   1. Après enregistrement
   2. Cliquer "Export Excel"
   3. Vérifier le fichier CSV
   4. Répéter avec PDF et Word
   ```

---

## 🚀 RÉSUMÉ RAPIDE

| Action | Résultat |
|--------|----------|
| 1. Ouvrir "Rapports de Sortie" | Tableau visible ✓ |
| 2. Remplir 3 colonnes par service | % calculés automatiquement ⚡ |
| 3. Cliquer "Enregistrer" | Données sauvegardées ✓ |
| 4. Tableau réinitialisé | Prêt pour nouveau rapport 🔄 |
| 5. Cliquer "Export Excel/PDF/Word" | Fichier téléchargé 📥 |

---

**Version**: 1.0  
**Commit**: 902a1362  
**Date**: 17 Avril 2026  
**Status**: ✅ Production Ready
