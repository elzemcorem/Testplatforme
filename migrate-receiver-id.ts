import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://rsuzgvluxymedbvdwnur.supabase.co";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzdXpndmx1eHltZWRidmR3bnVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY3MTAwNzQ5NywiZXhwIjoxOTg2NTgzNDk3fQ.DJn-pjpEiWGVYZdLQCUjBbpKV5z4-ZmP5J6gN1mX4BY";

async function migrateReceiverIdType() {
  try {
    console.log("🔄 Tentative de migration du type receiver_id...");

    // Créer un client avec la clé service role (permet les DDL)
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Vérifier d'abord le type actuel
    console.log("\n📋 Vérification du type actuel...");
    const { data: checkData, error: checkError } = await supabase
      .from("information_schema.columns")
      .select("column_name, data_type")
      .eq("table_name", "chat_messages")
      .eq("column_name", "receiver_id");

    if (checkError) {
      console.log("⚠️ Impossible de vérifier via Postgres (normal)");
    } else if (checkData?.length > 0) {
      console.log(`ℹ️ Type actuel: ${checkData[0].data_type}`);
    }

    // Essayer via RPC si disponible
    console.log("\n🔧 Exécution de la migration...");
    
    // Approche 1: Via rpc execute_sql (si disponible)
    console.log("  Tentative 1: Via RPC execute_sql...");
    let { error: rpcError } = await (supabase as any).rpc("execute_sql", {
      sql: "ALTER TABLE chat_messages ALTER COLUMN receiver_id TYPE text;",
    });

    if (rpcError?.message?.includes("404") || rpcError?.message?.includes("does not exist")) {
      console.log("  ⚠️ RPC execute_sql non disponible");
      
      // Approche 2: Via rpc exec_sql
      console.log("  Tentative 2: Via RPC exec_sql...");
      const { error: rpcError2 } = await (supabase as any).rpc("exec_sql", {
        sql: "ALTER TABLE chat_messages ALTER COLUMN receiver_id TYPE text;",
      });
      
      if (rpcError2) {
        console.log("  ⚠️ RPC exec_sql aussi échoué");
        throw rpcError2;
      }
    } else if (rpcError) {
      throw rpcError;
    }

    console.log("\n✅ Migration completée avec succès!");
    console.log("📝 Type receiver_id est maintenant TEXT");
    
  } catch (error: any) {
    console.error("\n❌ Erreur lors de la migration:", error?.message || error);
    console.log("\n💡 SOLUTION ALTERNATIVE:");
    console.log("1. Va sur https://app.supabase.com/");
    console.log("2. Clique sur 'SQL Editor'");
    console.log("3. Copie-colle ce SQL exactement:");
    console.log("");
    console.log("ALTER TABLE chat_messages ALTER COLUMN receiver_id TYPE text;");
    console.log("");
    console.log("4. Appuie sur Ctrl+Enter pour exécuter");
    console.log("5. Rafraîchis l'app (F5)");
  }
}

migrateReceiverIdType();
