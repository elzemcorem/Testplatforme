# 🟢 Guide Installation Real-Time Presence

## ✅ Étapes complétées

1. **presenceService.ts** créé dans `src/services/`
   - markOnline(): Enregistre l'utilisateur comme en ligne
   - markOffline(): Le marque comme hors ligne
   - getOnlineUsers(): Charge les utilisateurs en ligne
   - subscribeToPresence(): S'abonne aux changements temps réel

2. **Chat.tsx** modifié pour utiliser presenceService
   - Import de presenceService ajouté
   - Initialisation avec markOnline au montage
   - markOffline au démontage
   - Utilise presenceService.subscribeToPresence() pour mises à jour temps réel

3. **SETUP_USER_PRESENCE.sql** généré
   - Table user_presence avec RLS
   - Indexes sur is_online et user_id
   - Politiques RLS pour SELECT, INSERT, UPDATE, DELETE

## 🚀 Prochaines étapes

### 1. Exécuter le SQL dans Supabase
```bash
1. Aller à Supabase Dashboard → SQL Editor
2. Copier le contenu de SETUP_USER_PRESENCE.sql
3. Exécuter
4. Vérifier: Table créée avec RLS activé
```

### 2. Tester le présence tracking
```bash
# Terminal 1 - Ouvrir le chat
npm run dev

# Ouvrir dans 2 onglets/navigateurs différents:
- Onglet 1: Connecté avec user1@example.com
- Onglet 2: Connecté avec user2@example.com

# Vérifier:
✓ User2 apparaît dans "Utilisateurs connectés"
✓ Le nombre augmente/diminue avec les connexions
✓ Fermer un onglet = utilisateur disparaît après ~30s (heartbeat)
```

### 3. Vérifier les logs
```
Console browser:
✅ Utilisateur en ligne (markOnline)
✅ Présence subscribe
🔄 Changement de présence (sur chaque changement)
```

## 📊 Différences avec l'ancienne méthode

| Aspect | Avant (localStorage) | Après (user_presence) |
|--------|-------------------|----------------------|
| Source | Sessions browser locales | Base de données Supabase |
| Données | Comptes historiques du navigateur | Utilisateurs réellement en ligne |
| Temps réel | Poll toutes les 2s | Realtime subscription |
| Précision | ❌ Très imprécis | ✅ Exact |
| Multi-fenêtres | ❌ Désynchronisé | ✅ Synchronisé |

## 🔧 Troubleshooting

### Aucun utilisateur ne s'affiche
- Vérifier RLS: `SELECT * FROM user_presence;` dans Supabase SQL
- Vérifier markOnline() s'exécute (console logs)

### Erreur "table does not exist"
- Réexécuter SETUP_USER_PRESENCE.sql

### Utilisateurs restent "en ligne" trop longtemps
- Le heartbeat s'exécute toutes les 30s (configurable dans presenceService.ts)
- Augmenter la fréquence si nécessaire

## 🎯 Résultat attendu
Après exécution du SQL et test:
- ✅ Chat général fonctionne
- ✅ Messages privés fonctionnent
- ✅ Compteur utilisateurs connectés = réalité
- ✅ Mise à jour en temps réel quand un user se connecte/déconnecte
