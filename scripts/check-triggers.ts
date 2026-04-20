import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function checkTriggers() {
  console.log("🔍 Vérifiant les triggers sur auth.users...\n");
  
  // Requête pour voir les triggers
  const { data: triggerData, error: triggerError } = await supabase
    .rpc('check_pg_triggers', { 
      schema_name: 'auth',
      table_name: 'users'
    })
    .catch(() => ({ data: null, error: { message: 'RPC non disponible' } }));
  
  if (triggerError) {
    console.log("⚠️ Impossible d'accéder via RPC, vérifiez Supabase SQL Editor directement");
    console.log("\nExécutez cette requête dans Supabase SQL Editor:");
    console.log(`
SELECT 
  trigger_name,
  event_object_schema as schema,
  event_object_table as table_name,
  event_manipulation as event,
  action_timing as timing,
  action_orientation,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth' AND event_object_table = 'users'
ORDER BY trigger_name;
    `);
    return;
  }
  
  console.log("✅ Triggers trouvés:", triggerData);
}

checkTriggers();
