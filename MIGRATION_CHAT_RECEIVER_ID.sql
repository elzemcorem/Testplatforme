/**
 * MIGRATION SQL - À EXÉCUTER DANS SUPABASE SQL EDITOR
 * 
 * Ce script corrige le type de colonne receiver_id dans chat_messages
 * pour accepter les emails et UUIDs (au lieu de UUID uniquement)
 */

-- 1. Vérifier le type actuel
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name='chat_messages' AND column_name='receiver_id';

-- 2. Modifier le type de receiver_id en TEXT
ALTER TABLE chat_messages 
ALTER COLUMN receiver_id TYPE text;

-- 3. Vérifier la modification
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name='chat_messages' AND column_name='receiver_id';

-- Résultat attendu: receiver_id doit être de type 'text' au lieu de 'uuid'
