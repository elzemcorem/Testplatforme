import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://rsuzgvluxymedbvdwnur.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzdXpndmx1eHltZWRidmR3bnVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzEwMDc0OTcsImV4cCI6MTk4NjU4MzQ5N30.GR0JC5nXzUi8yYCWVKJwsXb8rnWJK3GlVJCYd5SXME4"
);

async function inspectChatMessagesSchema() {
  try {
    console.log("🔍 Inspection du schéma de chat_messages...\n");

    const { data, error } = await supabase
      .from("information_schema.columns")
      .select(
        "column_name, data_type, is_nullable, column_default, ordinal_position"
      )
      .eq("table_schema", "public")
      .eq("table_name", "chat_messages")
      .order("ordinal_position", { ascending: true });

    if (error) {
      console.error("❌ Erreur:", error.message);
      return;
    }

    if (!data || data.length === 0) {
      console.log("⚠️ Table chat_messages non trouvée ou pas de colonnes");
      return;
    }

    console.log("📋 Colonnes de la table:");
    console.log("─".repeat(80));
    data.forEach((col: any) => {
      const nullable = col.is_nullable === "YES" ? "✅ NULL" : "❌ NOT NULL";
      const defaultVal = col.column_default ? `(default: ${col.column_default})` : "";
      console.log(
        `${col.column_name.padEnd(20)} | ${col.data_type.padEnd(15)} | ${nullable} ${defaultVal}`
      );
    });

    console.log("\n" + "─".repeat(80));
    console.log("\n🔴 PROBLÈME IDENTIFIÉ:");
    const receiverIdCol = data.find((col: any) => col.column_name === "receiver_id");
    if (receiverIdCol) {
      console.log(`• receiver_id type: ${receiverIdCol.data_type}`);
      console.log(
        `• receiver_id nullable: ${receiverIdCol.is_nullable === "YES" ? "OUI ✅" : "NON ❌"}`
      );

      if (receiverIdCol.data_type === "uuid" && receiverIdCol.is_nullable === "NO") {
        console.log("\n🚨 SOLUTION REQUISE:");
        console.log("La colonne receiver_id est de type UUID et NOT NULL.");
        console.log("Deux solutions:");
        console.log("");
        console.log("Option 1 (Recommandée): Changer le type en TEXT et permettre NULL");
        console.log("  ALTER TABLE chat_messages ALTER COLUMN receiver_id TYPE text;");
        console.log("  ALTER TABLE chat_messages ALTER COLUMN receiver_id DROP NOT NULL;");
        console.log("");
        console.log("Option 2: Rendre la colonne nullable");
        console.log("  ALTER TABLE chat_messages ALTER COLUMN receiver_id DROP NOT NULL;");
      }
    }
  } catch (error: any) {
    console.error("❌ Exception:", error.message);
  }
}

inspectChatMessagesSchema();
