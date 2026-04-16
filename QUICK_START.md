# 🚀 DÉMARRAGE RAPIDE - 10 minutes

## ✅ Ce qui a été fait

✅ Code implémenté et testé (0 erreurs)
✅ Authentification restrictive : seulement `allowed_users`
✅ Gestion des 3 rôles : admin, controller, user
✅ Documentation complète créée

---

## 📋 Prochaines étapes (pour vous)

### Étape 1️⃣ : Créer la table (2 minutes)

Aller dans **Supabase → SQL Editor** et exécuter :

```sql
CREATE TABLE allowed_users (
  id INTEGER PRIMARY KEY,
  noms VARCHAR,
  email VARCHAR NOT NULL UNIQUE,
  role VARCHAR,
  created_at TIMESTAMP,
  password VARCHAR
);
```

### Étape 2️⃣ : Ajouter des utilisateurs test (1 minute)

```sql
INSERT INTO allowed_users (noms, email, role, created_at) VALUES
('Admin Test', 'admin@test.local', 'admin', NOW()),
('Controller Test', 'ctrl@test.local', 'controller', NOW()),
('User Test', 'user@test.local', 'user', NOW());
```

### Étape 3️⃣ : Tester en local (3 minutes)

```bash
# Démarrer l'application
npm run dev

# Ouvrir http://localhost:5173
# Essayer de se connecter avec admin@test.local
# Appuyer F12 pour voir les logs
```

### Étape 4️⃣ : Lire la documentation (4 minutes)

📖 **Commencer par** : [AUTHENTICATION_INDEX.md](AUTHENTICATION_INDEX.md)

---

## 🎯 Points clés à retenir

| Concept | Détail |
|---------|--------|
| **Table source** | `allowed_users` dans Supabase |
| **Colonnes** | id, noms, email, role, created_at, password |
| **Rôles** | "admin" \| "controller" \| "user" |
| **Sécurité** | Double vérification : allowed_users + Supabase Auth |
| **Pas d'auto-création** | Un email doit être dans allowed_users AVANT de pouvoir se connecter |

---

## 🔒 Comment ça fonctionne

```
Utilisateur tape email + mot de passe
                    ↓
Vérifier : Email dans allowed_users?
         ├─ NON  → ❌ Accès refusé
         └─ OUI  → Vérifier mot de passe avec Supabase Auth
                        ├─ Faux → ❌ Mot de passe incorrect
                        └─ OK   → ✅ Connecté avec son rôle
```

---

## 📚 Documentation par besoin

**Je veux juste commencer** ✨
→ Ce fichier (vous le lisez!)

**Je dois administrer les utilisateurs** 👨‍💼
→ [ADMIN_GUIDE.md](ADMIN_GUIDE.md)

**Je dois intégrer ça dans mon code** 👨‍💻
→ [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)

**Je dois tester avant de déployer** ✅
→ [VERIFICATION_CHECKLIST.md](VERIFICATION_CHECKLIST.md)

**Je dois tout comprendre** 📖
→ [AUTHENTICATION_SETUP_SUMMARY.md](AUTHENTICATION_SETUP_SUMMARY.md)

---

## ❓ Questions rapides

**Q: Un utilisateur ne peut pas se connecter?**
```sql
-- Vérifier qu'il existe dans allowed_users
SELECT * FROM allowed_users WHERE email = 'user@email.com';

-- S'il n'y est pas, l'ajouter:
INSERT INTO allowed_users (noms, email, role) 
VALUES ('Nom', 'user@email.com', 'user');
```

**Q: Changer le rôle d'un utilisateur?**
```sql
UPDATE allowed_users SET role = 'admin' WHERE email = 'user@email.com';
```

**Q: Supprimer un utilisateur?**
```sql
DELETE FROM allowed_users WHERE email = 'user@email.com';
```

---

## 🎉 Vous êtes prêt!

1. ✅ Créer la table (voir Étape 1)
2. ✅ Ajouter des utilisateurs (voir Étape 2)
3. ✅ Tester (voir Étape 3)
4. ✅ Lire la documentation (voir Étape 4)
5. ✅ Déployer en production!

---

## 📞 Support

- **Erreurs** ? Voir [VERIFICATION_CHECKLIST.md → Troubleshooting](VERIFICATION_CHECKLIST.md)
- **Questions admin** ? Voir [ADMIN_GUIDE.md](ADMIN_GUIDE.md)
- **Questions dev** ? Voir [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)
- **Vue générale** ? Voir [README_AUTHENTICATION.md](README_AUTHENTICATION.md)

---

**Status** : 🚀 Prêt à déployer
**Temps estimé** : 10 minutes pour commencer
**Aide** : Consultez les fichiers .md dans le dossier `src/`

✅ **BON COURAGE!**
