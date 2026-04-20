-- Script pour autoriser la connexion sans confirmation d'email
-- pour les utilisateurs dans la table allowed_users

-- Option 1: Désactiver la vérification d'email pour tous les signups (RECOMMANDÉ)
-- À exécuter dans Supabase SQL Editor

-- Cette fonction automatise la confirmation d'email lors du signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Vérifier si l'email est dans allowed_users
  IF EXISTS (SELECT 1 FROM allowed_users WHERE email = NEW.email) THEN
    -- Confirmer automatiquement l'email pour les utilisateurs autorisés
    UPDATE auth.users
    SET email_confirmed_at = NOW(),
        confirmed_at = NOW()
    WHERE id = NEW.id AND email_confirmed_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- Créer le trigger si il n'existe pas
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
