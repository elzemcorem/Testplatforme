# 🔴 ACTION REQUISE: Migration SQL - receiver_id TYPE

## Problème
```
❌ invalid input syntax for type uuid: "akounou@beninpetro.com"
```

La colonne `chat_messages.receiver_id` est encore de type **UUID** et refuse les emails!

## Solution - 3 étapes faciles

### **ÉTAPE 1️⃣: Ouvre Supabase Dashboard**
1. Va sur https://app.supabase.com/
2. Sélectionne ton projet
3. Clique sur **SQL Editor** (à gauche)

### **ÉTAPE 2️⃣: Exécute ce SQL**
Copie-colle exactement ce code:

```sql
-- Vérifier le type actuel
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name='chat_messages' AND column_name='receiver_id';

-- Changer le type en TEXT
ALTER TABLE chat_messages 
ALTER COLUMN receiver_id TYPE text;

-- Vérifier la modification
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name='chat_messages' AND column_name='receiver_id';
```

3. Appuie sur **Cmd+Enter** (Mac) ou **Ctrl+Enter** (Windows)
4. Attends la réponse ✅

### **ÉTAPE 3️⃣: Vérifie le résultat**
Tu devrais voir:
```
receiver_id | text
```

Au lieu de:
```
receiver_id | uuid
```

### **ÉTAPE 4️⃣: Reviens à l'app**
1. Rafraîchis la page (F5)
2. Essaie d'envoyer un message dans le **chat général**
3. 🎉 Ça devrait marcher!

## Alternative - Si tu es connecté au terminal
```bash
cd c:\Users\HP\Downloads\Energymanagementsystemdashboard-main\ (3)\Energymanagementsystemdashboard-main
npx ts-node -e "console.log('Exécute le SQL ci-dessus dans Supabase SQL Editor')"
```

## ⚠️ Ne pas ignorer!
Si tu n'exécutes pas ce SQL, **TOUS les chats privés et généraux seront cassés** parce que:
- `sender_id` = email (TEXT)
- `receiver_id` = uuid (UUID) ← **INCOMPATIBLE!**

## Besoin d'aide?
Si tu vois une erreur dans Supabase SQL Editor, partage le message d'erreur complet!
