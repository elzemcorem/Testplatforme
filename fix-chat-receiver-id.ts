import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://rsuzgvluxymedbvdwnur.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzdXpndmx1eHltZWRidmR3bnVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzEwMDc0OTcsImV4cCI6MTk4NjU4MzQ5N30.GR0JC5nXzUi8yYCWVKJwsXb8rnWJK3GlVJCYd5SXME4"
);

async function fixChatReceiverType() {
  try {
    console.log("🔄 Modification du type de receiver_id en TEXT...");

    const { error } = await supabase.rpc("execute_sql", {
      sql: "ALTER TABLE chat_messages ALTER COLUMN receiver_id TYPE text;",
    });

    if (error) {
      console.error("❌ Erreur lors de la modification:", error);
      return;
    }

    console.log("✅ Type de receiver_id changé en TEXT avec succès!");
  } catch (error) {
    console.error("❌ Exception:", error);
  }
}

fixChatReceiverType();
