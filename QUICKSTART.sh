#!/usr/bin/env bash
# ============================================================================
# DÉMARRAGE RAPIDE: Diagnostic auth.users - Triggers et RLS
# ============================================================================
# 
# Usage: Lisez ce fichier pour comprendre les étapes à suivre
#        Il n'y a RIEN à exécuter dans le terminal
#        Toutes les requêtes doivent être exécutées dans Supabase Console
# ============================================================================

echo "═══════════════════════════════════════════════════════════════════════════════"
echo "🚀 DÉMARRAGE RAPIDE: Diagnostic auth.users"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""
echo "Votre problème: Users reçoivent '500 Internal Server Error' au signup"
echo "Admin/Contrôleur fonctionnent normalement"
echo "Vous venez de créer un trigger AFTER INSERT pour confirmer les emails"
echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""

# ÉTAPE 1: Où aller
cat << 'EOF'
⚠️ IMPORTANT: Ces étapes se font DANS SUPABASE CONSOLE, PAS dans le terminal

📍 ÉTAPE 1: Ouvrir Supabase Console
   1. Allez sur https://app.supabase.com
   2. Sélectionnez votre projet
   3. Cliquez sur "SQL Editor" (menu gauche)
   4. Créez une "New Query"

EOF

# ÉTAPE 2: Exécuter la première requête
cat << 'EOF'
🔍 ÉTAPE 2: Exécuter cette requête (copier-coller dans Supabase)

┌─────────────────────────────────────────────────────────────────────────────┐
│ SELECT trigger_name, event_manipulation, action_timing, action_statement   │
│ FROM information_schema.triggers                                            │
│ WHERE event_object_schema = 'auth' AND event_object_table = 'users'       │
│ ORDER BY trigger_name;                                                      │
└─────────────────────────────────────────────────────────────────────────────┘

Résultat attendu:
  • Aucune ligne = Pas de triggers (continue ÉTAPE 3)
  • 1+ lignes = Trigger trouvé (va à ÉTAPE 4)

EOF

# ÉTAPE 3: Vérifier RLS
cat << 'EOF'
🔍 ÉTAPE 3: Vérifier l'état de RLS

┌─────────────────────────────────────────────────────────────────────────────┐
│ SELECT schemaname, tablename, rowsecurity                                  │
│ FROM pg_tables                                                              │
│ WHERE schemaname = 'auth' AND tablename = 'users';                         │
└─────────────────────────────────────────────────────────────────────────────┘

Résultat attendu:
  • rowsecurity = false = RLS désactivé ✓ (probablement OK)
  • rowsecurity = true = RLS activé (va à ÉTAPE 5)

EOF

# ÉTAPE 4: Si trigger trouvé
cat << 'EOF'
⚠️ ÉTAPE 4: Si trigger trouvé à l'ÉTAPE 2, exécutez ceci

┌─────────────────────────────────────────────────────────────────────────────┐
│ SELECT                                                                       │
│   t.trigger_name, t.event_manipulation, t.action_timing,                  │
│   p.proname as trigger_function, t.action_statement                        │
│ FROM information_schema.triggers t                                          │
│ LEFT JOIN pg_trigger pt ON pt.tgname = t.trigger_name                     │
│ LEFT JOIN pg_proc p ON pt.tgfoid = p.oid                                  │
│ WHERE t.event_object_schema = 'auth' AND t.event_object_table = 'users'  │
│ ORDER BY t.trigger_name;                                                    │
└─────────────────────────────────────────────────────────────────────────────┘

À chercher dans la colonne "action_statement":
  • ❌ RAISE EXCEPTION = PROBLÈME TROUVÉ!
  • ❌ IF NEW.role = 'user' + RAISE = PROBLÈME TROUVÉ!
  • ✅ Juste des UPDATE = Probablement OK

EOF

# ÉTAPE 5: Si RLS = true
cat << 'EOF'
⚠️ ÉTAPE 5: Si RLS = true à l'ÉTAPE 3, exécutez ceci

┌─────────────────────────────────────────────────────────────────────────────┐
│ SELECT policyname, permissive, roles, qual, with_check                     │
│ FROM pg_policies                                                            │
│ WHERE schemaname = 'auth' AND tablename = 'users';                         │
└─────────────────────────────────────────────────────────────────────────────┘

Résultat attendu:
  • Aucune ligne = RLS activé mais pas de politiques (OK)
  • 1+ lignes = Politiques trouvées (à analyser)

À chercher:
  • Politique "RESTRICTIVE" = Peut bloquer
  • Politique mentionnant "role != 'admin'" = Peut bloquer users

EOF

# RÉSUMÉ
cat << 'EOF'
═══════════════════════════════════════════════════════════════════════════════
📊 RÉSUMÉ: Après avoir exécuté les étapes ci-dessus
═══════════════════════════════════════════════════════════════════════════════

Trois scénarios possibles:

🔴 SCÉNARIO 1: Trigger trouvé + action_statement avec RAISE EXCEPTION
   → C'EST LE PROBLÈME!
   → Le trigger lève une exception pour les users

   Solution rapide pour TESTER:
   ┌─────────────────────────────────────────────────────────────────────┐
   │ ALTER TABLE auth.users DISABLE TRIGGER <NOM_DU_TRIGGER>;           │
   │ -- Testez le signup des users...                                    │
   │ -- Si ça marche, le trigger est le problème                         │
   │ ALTER TABLE auth.users ENABLE TRIGGER <NOM_DU_TRIGGER>;            │
   └─────────────────────────────────────────────────────────────────────┘

🔴 SCÉNARIO 2: RLS = true + politiques restrictives
   → Peut être un problème
   → Les politiques RLS bloquent les users

   Solution rapide pour TESTER:
   ┌─────────────────────────────────────────────────────────────────────┐
   │ ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;                 │
   │ -- Testez le signup des users...                                    │
   │ -- Si ça marche, les politiques sont le problème                    │
   │ ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;                  │
   └─────────────────────────────────────────────────────────────────────┘

🟢 SCÉNARIO 3: Aucun trigger + RLS = false
   → Le problème vient d'ailleurs
   → Consultez les logs Supabase (Logs → Auth Events)

═══════════════════════════════════════════════════════════════════════════════
📁 FICHIERS DISPONIBLES POUR RÉFÉRENCE
═══════════════════════════════════════════════════════════════════════════════

1. README_DIAGNOSTIC.md (DÉMARRAGE RAPIDE - LIRE EN PREMIER)
   • Navigation entre les fichiers
   • Index complet
   • Flux de diagnostic

2. SYNTHESE_COMPLETE.md (VUE D'ENSEMBLE COMPLÈTE)
   • Vue d'ensemble du problème
   • 5 étapes de vérification
   • Solutions par scénario
   • Tableau de diagnostic

3. AUTH_USERS_DIAGNOSTIC_REPORT.md (RÉFÉRENCE DÉTAILLÉE)
   • 8 requêtes SQL complet
   • Checklist de débogage
   • Actions recommandées
   • Guides pas à pas

4. TRIGGER_DETAILS.md (ACTIONS IMMÉDIATES)
   • Résumé d'urgence
   • 3 requêtes prioritaires
   • Hypothèse probable

5. SQL_DIAGNOSTIC_AUTH_USERS.sql (REQUÊTES SQL)
   • 10 requêtes SQL prêtes à copier-coller
   • Commentaires explicatifs
   • Exécuter dans Supabase SQL Editor

═══════════════════════════════════════════════════════════════════════════════
⚡ ACTION RECOMMANDÉE
═══════════════════════════════════════════════════════════════════════════════

1. Lisez ce fichier (vous le lisez maintenant) ✓
2. Allez dans Supabase Console → SQL Editor
3. Exécutez les requêtes des ÉTAPES 2-5
4. Identifiez le problème (trigger/RLS/autre)
5. Consultez le fichier approprié pour la solution
6. Appliquez la correction
7. Testez le signup des users

═══════════════════════════════════════════════════════════════════════════════
💡 CONSEIL: Hypothèse la plus probable
═══════════════════════════════════════════════════════════════════════════════

Votre trigger AFTER INSERT pour confirmer les emails lève probablement une
exception pour les users au lieu de les traiter normalement:

   ❌ MAUVAIS:
   IF NEW.role = 'user' THEN
     RAISE EXCEPTION 'Users not allowed';  -- ← 500 ERROR!
   END IF;

   ✅ BON:
   IF NEW.email IS NOT NULL THEN
     UPDATE auth.users SET email_confirmed_at = NOW() WHERE id = NEW.id;
   END IF;

C'est probablement votre problème. Le test rapide (désactiver le trigger)
vous le confirmera.

═══════════════════════════════════════════════════════════════════════════════

Bonne chance! 🚀

EOF
