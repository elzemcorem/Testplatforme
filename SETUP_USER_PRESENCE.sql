-- Créer la table user_presence
CREATE TABLE IF NOT EXISTS public.user_presence (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  initials TEXT NOT NULL,
  role TEXT NOT NULL,
  is_online BOOLEAN DEFAULT FALSE,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajouter l'index sur user_id et is_online
CREATE INDEX IF NOT EXISTS user_presence_is_online_idx ON public.user_presence(is_online);
CREATE INDEX IF NOT EXISTS user_presence_user_id_idx ON public.user_presence(user_id);

-- Enable RLS
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- Politique permettant à tous les utilisateurs authentifiés de lire
CREATE POLICY "Lire les utilisateurs en ligne" ON public.user_presence
  FOR SELECT
  TO authenticated
  USING (true);

-- Politique permettant aux utilisateurs de mettre à jour leurs propres données
CREATE POLICY "Mettre à jour sa propre présence" ON public.user_presence
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'email' = email)
  WITH CHECK (auth.jwt() ->> 'email' = email);

-- Politique permettant aux utilisateurs d'insérer leurs données
CREATE POLICY "Insérer sa propre présence" ON public.user_presence
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' = email);

-- Politique permettant aux utilisateurs de supprimer leurs propres données
CREATE POLICY "Supprimer sa propre présence" ON public.user_presence
  FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'email' = email);
