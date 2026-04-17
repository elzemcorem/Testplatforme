# 🚨 FIX SQL REQUIS - Chat Messages Schema

## Problème Identifié

**Erreur 400 Bad Request** vient du fait que:
- ✅ `sender_id` = TEXT (email)
- ❌ `receiver_id` = UUID + **NOT NULL**
- ❌ On envoie `null` pour messages généraux
- ❌ Supabase refuse car NOT NULL!

## Solution - 2 Commandes SQL

### Étape 1️⃣: Va dans Supabase Dashboard
1. https://app.supabase.com/
2. Sélectionne ton projet
3. **SQL Editor** (menu gauche)

### Étape 2️⃣: Exécute EXACTEMENT ce SQL

```sql
-- Changer receiver_id de UUID à TEXT
ALTER TABLE chat_messages 
ALTER COLUMN receiver_id TYPE text;

-- Rendre la colonne nullable (peut être NULL)
ALTER TABLE chat_messages 
ALTER COLUMN receiver_id DROP NOT NULL;
```

**Copie-colle les 2 lignes ci-dessus dans SQL Editor!**

### Étape 3️⃣: Appuie sur Ctrl+Enter

Tu devrais voir:
```
✅ Query executed successfully
```

### Étape 4️⃣: Vérification

```sql
-- Vérifie que c'est bon
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name='chat_messages' 
AND column_name='receiver_id';
```

Résultat attendu:
```
receiver_id | text | YES
```

## Après la Migration

1. Rafraîchis l'app (F5)
2. Va dans le **chat général**
3. Envoie un message
4. 🎉 Les messages devraient marcher!
5. Teste les **chats privés** aussi

## Si ça ne marche pas

- Vérifie que tu as exécuté les 2 lignes SQL
- Rafraîchis bien avec F5 (pas juste rechargement partiel)
- Ouvre la console F12 pour voir les erreurs exactes

## Pourquoi c'est nécessaire?

| Colonne | Type Actuel | Type Requis | Nullable? |
|---------|------------|------------|-----------|
| sender_id | UUID | TEXT | ✅ YES |
| receiver_id | UUID ❌ | TEXT ✅ | ❌ NO → ✅ YES |
| content | TEXT | TEXT | ✅ YES |

La raison: 
- On envoie des **emails** (TEXT), pas des UUIDs
- Messages généraux = `receiver_id = NULL`
- Messages privés = `receiver_id = email du destinataire`
