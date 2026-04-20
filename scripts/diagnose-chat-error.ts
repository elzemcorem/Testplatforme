import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://rsuzgvluxymedbvdwnur.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzdXpndmx1eHltZWRidmR3bnVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzEwMDc0OTcsImV4cCI6MTk4NjU4MzQ5N30.GR0JC5nXzUi8yYCWVKJwsXb8rnWJK3GlVJCYd5SXME4"
);

async function diagnoseChat() {
  try {
    console.log("🔍 DIAGNOSTIC COMPLET - Chat Messages Schema\n");

    // Essayer d'insérer un message simple pour voir l'erreur exacte
    console.log("📤 Test d'insertion...");
    const { data, error } = await supabase
      .from("chat_messages")
      .insert([
        {
          sender_id: "test@example.com",
          sender_name: "Test User",
          sender_initials: "TU",
          receiver_id: null,
          content: "Test message",
          conversation_id: "test_conv",
          is_deleted: false,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.log("❌ Erreur d'insertion:", error.message);
      console.log("Code d'erreur:", error.code);
      console.log("\n📋 Analyse:");

      if (
        error.message?.includes("invalid input syntax") &&
        error.message?.includes("uuid")
      ) {
        console.log(
          "→ La colonne attend un UUID, pas du texte (sender_id ou receiver_id)"
        );
        console.log("\n🚨 COLONNES A CHANGER:");
        console.log("1. sender_id: UUID → TEXT");
        console.log("2. receiver_id: UUID → TEXT");
      } else if (error.message?.includes("null value in column")) {
        console.log("→ Une colonne NOT NULL reçoit NULL");
        const match = error.message.match(/column "([^"]+)"/);
        if (match) {
          console.log(`\n🚨 PROBLEME: Colonne '${match[1]}' est NOT NULL`);
          console.log(
            `   Solution: ALTER TABLE chat_messages ALTER COLUMN ${match[1]} DROP NOT NULL;`
          );
        }
      }

      console.log("\n✅ COMMANDES SQL A EXECUTER:");
      console.log(`
-- Solution complète:
ALTER TABLE chat_messages ALTER COLUMN sender_id TYPE text;
ALTER TABLE chat_messages ALTER COLUMN receiver_id TYPE text;
ALTER TABLE chat_messages ALTER COLUMN sender_id DROP NOT NULL;
ALTER TABLE chat_messages ALTER COLUMN receiver_id DROP NOT NULL;

-- Vérification:
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name='chat_messages' 
AND column_name IN ('sender_id', 'receiver_id');
      `);
      return;
    }

    console.log("✅ Message inséré avec succès!");
    console.log("Data:", data);

    // Nettoyer le test
    if (data?.id) {
      await supabase.from("chat_messages").delete().eq("id", data.id);
      console.log("🧹 Message de test supprimé");
    }
  } catch (error: any) {
    console.error("❌ Exception:", error.message);
  }
}

diagnoseChat();
