# 🚨 FIX REQUIS: Chat Privé - Migration SQL

## Problème
Impossible d'envoyer des messages dans les **chats privés** (1-on-1). Les messages généraux fonctionnent.

**Erreur dans la console F12:**
```
❌ ERREUR: La colonne receiver_id doit être de type TEXT
📝 À EXÉCUTER dans Supabase SQL Editor:
ALTER TABLE chat_messages ALTER COLUMN receiver_id TYPE text;
```

## Cause
- La table `chat_messages.receiver_id` est de type `UUID`
- Les utilisateurs dans `allowed_users` ont un ID entier (3, 4, 5...)
- On ne peut pas stocker un email ou un ID entier dans une colonne UUID
- Solution: Changer le type en `TEXT`

## Solution - 2 étapes

### Step 1: Exécuter le SQL Migration
1. Va sur [Supabase Dashboard](https://app.supabase.com/) → SQL Editor
2. Copie-colle ce SQL:

```sql
-- Modifier receiver_id de UUID en TEXT
ALTER TABLE chat_messages ALTER COLUMN receiver_id TYPE text;

-- Vérifier
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name='chat_messages' AND column_name='receiver_id';
```

3. Exécute (Cmd+Enter ou bouton ▶️)
4. Tu devrais voir: `receiver_id | text`

### Step 2: Rafraîchir l'app
- Reviens sur l'app et rafraîchis F5
- Essaie d'envoyer un message privé
- 🎉 Ça devrait marcher!

## Vérification
Après la migration, teste:
1. **User1 (Opera)**: Sélectionne User2 dans le chat
2. **User1**: Envoie un message privé
3. **User2 (Edge)**: Devrait recevoir le message en **temps réel**
4. **User2**: Réponds au message
5. **User1**: Devrait voir la réponse en temps réel

## Fichiers modifiés
- ✅ `AuthContext.tsx`: Charger les utilisateurs depuis Supabase (utilise email comme ID)
- ✅ `chatService.ts`: Accepte les emails comme `receiverId`
- ✅ `Chat.tsx`: Envoie l'email comme `receiverId` pour les chats privés

## Erreur si non exécuté
```
❌ invalid input syntax for type uuid: "akounou@beninpetro.com"
```

→ C'est normal! C'est juste l'avertissement que tu dois exécuter le SQL ci-dessus! 👆
