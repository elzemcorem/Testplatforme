import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://rsuzgvluxymedbvdwnur.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzdXpndmx1eHltZWRidmR3bnVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzEwMDc0OTcsImV4cCI6MTk4NjU4MzQ5N30.GR0JC5nXzUi8yYCWVKJwsXb8rnWJK3GlVJCYd5SXME4"
);

async function findAllPolicies() {
  try {
    console.log("🔍 Recherche de TOUTES les politiques sur chat_messages...\n");

    // Requête PostgreSQL pour trouver toutes les politiques
    const sqlQuery = `
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'chat_messages'
    ORDER BY policyname;
    `;

    console.log("Exécution de requête PostgreSQL...");

    // Via une requête RPC ou directe
    const { data, error } = await (supabase as any).rpc("get_policies", {
      table_name: "chat_messages",
    });

    if (error) {
      console.log("⚠️ Impossible de récupérer via RPC");
      console.log("📝 Générant le SQL manuel...\n");

      generateDropAllPoliciesSQL();
      return;
    }

    console.log("Politiques trouvées:");
    data?.forEach((policy: any) => {
      console.log(`  - ${policy.policyname}`);
    });

  } catch (error) {
    console.error("Exception:", error);
    generateDropAllPoliciesSQL();
  }
}

function generateDropAllPoliciesSQL() {
  console.log("📋 SQL pour supprimer TOUTES les politiques:\n");
  console.log(`
-- Récupérer et supprimer toutes les politiques existantes
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'chat_messages'
  ) LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.tablename;
    RAISE NOTICE 'Dropped policy: %', r.policyname;
  END LOOP;
END $$;

-- Désactiver RLS
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;

-- CHANGER LES TYPES
ALTER TABLE chat_messages ALTER COLUMN sender_id TYPE text;
ALTER TABLE chat_messages ALTER COLUMN receiver_id TYPE text;
ALTER TABLE chat_messages ALTER COLUMN sender_id DROP NOT NULL;
ALTER TABLE chat_messages ALTER COLUMN receiver_id DROP NOT NULL;

-- Vérification
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name='chat_messages' 
AND column_name IN ('sender_id', 'receiver_id');
  `);

  console.log("\n✅ Copie-colle ce SQL complet dans Supabase SQL Editor!");
  console.log("🔗 https://app.supabase.com/ → SQL Editor");
  console.log("\nCe script utilise PL/pgSQL pour supprimer TOUTES les politiques automatiquement.");
}

findAllPolicies();
