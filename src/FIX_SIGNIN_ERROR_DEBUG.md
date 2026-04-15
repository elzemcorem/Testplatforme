# 🔧 Fix : Erreur "Invalid login credentials"

## 🎯 Problème

L'erreur "Invalid login credentials" apparaît dans les logs serveur mais le système de création automatique de compte ne se déclenche pas.

```
Signin error: AuthApiError: Invalid login credentials
```

## 🔍 Diagnostics Ajoutés

J'ai ajouté des logs détaillés pour identifier où exactement le code échoue :

### 1. **Vérification des Variables d'Environnement**

```typescript
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

console.log(`🔍 Environment check:`);
console.log(`   - SUPABASE_URL: ${supabaseUrl ? 'SET ✅' : 'MISSING ❌'}`);
console.log(`   - SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'SET ✅' : 'MISSING ❌'}`);
```

**Pourquoi** : Si les variables d'environnement ne sont pas définies, le client Supabase ne peut pas se connecter.

---

### 2. **Vérification de l'Existence de l'Utilisateur**

```typescript
console.log(`🔍 Checking if user exists: ${email}`);
console.log(`📋 Fetching user list from Supabase...`);

const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();

if (listError) {
  console.error(`❌ Error listing users:`, listError);
  return c.json({ error: `Failed to check user existence: ${listError.message}` }, 500);
}

console.log(`📊 Found ${listData?.users?.length || 0} total users`);
const userExists = listData?.users?.some(u => u.email === email);
console.log(`🔍 User ${email} exists: ${userExists}`);
```

**Pourquoi** : Pour distinguer entre :
- ❌ Utilisateur n'existe pas → Créer le compte automatiquement
- ❌ Mot de passe incorrect → Retourner une erreur

---

## 📊 Logs Attendus

### ✅ Cas 1 : Création Automatique de Compte

**Email** : `admin1@beninpetro.com` (n'existe pas encore)  
**Mot de passe** : `test123456`

**Logs attendus** :
```
🔐 Signin request for: admin1@beninpetro.com
🔍 Environment check:
   - SUPABASE_URL: SET ✅
   - SUPABASE_ANON_KEY: SET ✅
Signin error: AuthApiError: Invalid login credentials
🔍 Checking if user exists: admin1@beninpetro.com
📋 Fetching user list from Supabase...
📊 Found 0 total users
🔍 User admin1@beninpetro.com exists: false
📝 User not found, creating account for: admin1@beninpetro.com
📝 Determined role for admin1@beninpetro.com: admin (username: admin1)
✅ Account auto-created and logged in: admin1@beninpetro.com
```

---

### ❌ Cas 2 : Mot de Passe Incorrect

**Email** : `admin1@beninpetro.com` (existe déjà)  
**Mot de passe** : `wrongpassword`

**Logs attendus** :
```
🔐 Signin request for: admin1@beninpetro.com
🔍 Environment check:
   - SUPABASE_URL: SET ✅
   - SUPABASE_ANON_KEY: SET ✅
Signin error: AuthApiError: Invalid login credentials
🔍 Checking if user exists: admin1@beninpetro.com
📋 Fetching user list from Supabase...
📊 Found 1 total users
🔍 User admin1@beninpetro.com exists: true
❌ Wrong password for existing account: admin1@beninpetro.com
```

---

### ❌ Cas 3 : Variables d'Environnement Manquantes

**Logs attendus** :
```
🔐 Signin request for: admin1@beninpetro.com
🔍 Environment check:
   - SUPABASE_URL: MISSING ❌
   - SUPABASE_ANON_KEY: MISSING ❌
❌ Missing environment variables!
```

**Erreur retournée** :
```json
{
  "error": "Server configuration error: Missing environment variables"
}
```

---

## 🔧 Causes Possibles de l'Erreur

### 1. **Variables d'Environnement Non Définies**

**Symptôme** :
```
🔍 Environment check:
   - SUPABASE_URL: MISSING ❌
   - SUPABASE_ANON_KEY: MISSING ❌
```

**Solution** :
1. Allez dans Supabase Dashboard
2. Settings > Edge Functions
3. Vérifiez que les variables sont définies :
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

---

### 2. **Erreur lors du Listage des Utilisateurs**

**Symptôme** :
```
📋 Fetching user list from Supabase...
❌ Error listing users: [erreur détaillée]
```

**Solution** :
- Vérifiez que `SUPABASE_SERVICE_ROLE_KEY` est correct
- Vérifiez les permissions de l'API Key

---

### 3. **Le Code ne Continue Pas Après l'Erreur**

**Symptôme** :
```
Signin error: AuthApiError: Invalid login credentials
[Aucun log supplémentaire]
```

**Cause Possible** :
- Une exception est levée dans le bloc `try/catch` interne
- Le code s'arrête avant d'atteindre la logique de vérification

**Solution** :
- Regardez les nouveaux logs pour identifier où exactement ça bloque

---

## 🧪 Comment Tester

### Étape 1 : Observer les Logs

1. Ouvrez la console du navigateur (F12)
2. Allez sur Supabase Dashboard > Edge Functions > Logs
3. Essayez de vous connecter avec un email qui n'existe pas
4. Observez les logs dans l'ordre

### Étape 2 : Identifier le Problème

**Regardez quel log apparaît en dernier** :

| Dernier Log | Problème | Solution |
|-------------|----------|----------|
| `SUPABASE_URL: MISSING ❌` | Variables d'environnement manquantes | Configurer dans Supabase Dashboard |
| `Signin error: AuthApiError` (aucun log après) | Exception dans le bloc try/catch | Vérifier l'erreur complète |
| `Error listing users: [erreur]` | Problème avec `listUsers()` | Vérifier SERVICE_ROLE_KEY |
| `User ... exists: true` | Mot de passe incorrect | Normal - utilisateur doit corriger le mot de passe |
| `User ... exists: false` | Devrait créer le compte | Si pas de log après, vérifier `createUser()` |

### Étape 3 : Résoudre

En fonction du dernier log, suivez la solution correspondante dans le tableau ci-dessus.

---

## 🎯 Vérifications de Base

Avant de tester, assurez-vous que :

- [ ] Les variables d'environnement sont définies dans Supabase :
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Le code serveur est déployé (Supabase redéploie automatiquement)
- [ ] Vous utilisez un email **qui n'existe pas encore**
- [ ] Le mot de passe fait au moins 6 caractères

---

## 🚨 Erreurs Courantes

### Erreur 1 : "Server configuration error: Missing environment variables"

**Cause** : Variables d'environnement non définies

**Solution** :
1. Allez dans Supabase Dashboard
2. Settings > Edge Functions > Configuration
3. Ajoutez les variables :
```
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

---

### Erreur 2 : "Failed to check user existence"

**Cause** : Problème avec `listUsers()` - généralement lié à SERVICE_ROLE_KEY

**Solution** :
1. Vérifiez que `SUPABASE_SERVICE_ROLE_KEY` est correct
2. Copiez la clé depuis Supabase Dashboard > Settings > API > `service_role` (secret)
3. Remplacez la valeur dans Edge Functions > Configuration

---

### Erreur 3 : L'erreur se répète sans logs supplémentaires

**Cause** : Exception dans le bloc try/catch qui n'est pas capturée

**Solution** :
1. Regardez les logs Supabase pour l'erreur complète
2. Vérifiez que le serveur est bien déployé
3. Essayez de redéployer manuellement si nécessaire

---

## ✅ Success Indicators

Vous saurez que tout fonctionne quand vous verrez :

**Dans les logs serveur** :
```
✅ Account auto-created and logged in: admin1@beninpetro.com
```

**Dans le frontend (console)** :
```
🎉 Account created automatically!
✅ Login successful!
```

**Dans l'interface** :
- Connexion réussie
- Utilisateur redirigé vers le dashboard
- Rôle correctement assigné (Admin, Contrôleur, ou Utilisateur)

---

## 📝 Résumé des Changements

### Fichier : `/supabase/functions/server/index.tsx`

**Ajouté** :

1. **Validation des variables d'environnement** :
```typescript
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(`❌ Missing environment variables!`);
  return c.json({ error: "Server configuration error: Missing environment variables" }, 500);
}
```

2. **Logs détaillés pour le débogage** :
```typescript
console.log(`🔍 Checking if user exists: ${email}`);
console.log(`📋 Fetching user list from Supabase...`);
console.log(`📊 Found ${listData?.users?.length || 0} total users`);
console.log(`🔍 User ${email} exists: ${userExists}`);
```

3. **Gestion d'erreur pour `listUsers()`** :
```typescript
if (listError) {
  console.error(`❌ Error listing users:`, listError);
  return c.json({ error: `Failed to check user existence: ${listError.message}` }, 500);
}
```

---

## 🎓 Prochaines Étapes

1. **Testez la connexion** avec un nouvel email
2. **Observez les logs** dans Supabase Dashboard
3. **Identifiez le dernier log** qui apparaît
4. **Suivez la solution** correspondante dans ce document
5. **Rapportez les logs** si le problème persiste

---

**🚀 Les logs détaillés vous aideront à identifier exactement où le processus échoue !**
