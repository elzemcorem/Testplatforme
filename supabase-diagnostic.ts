import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";

async function runDiagnostics() {
  console.log("🔍 Diagnostic Supabase Simplifié\n");
  console.log("=" + "=".repeat(70));

  // Test 1: Env vars
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.log("❌ FAIL: Variables d'environnement manquantes");
    return;
  }
  console.log("✅ PASS: Variables d'environnement trouvées");

  // Test 2: Créer le client
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("✅ PASS: Client Supabase initialisé");

    // Test 3: Table chat_messages
    try {
      const { error, count } = await supabase
        .from("chat_messages")
        .select("id", { count: "exact", head: true });

      if (error) {
        console.log(`❌ FAIL: chat_messages - ${error.message}`);
      } else {
        console.log(`✅ PASS: chat_messages existe (${count} messages)`);
      }
    } catch (e: any) {
      console.log(`❌ FAIL: chat_messages - ${e.message}`);
    }

    // Test 4: Table reservations
    try {
      const { error, count } = await supabase
        .from("reservations")
        .select("id", { count: "exact", head: true });

      if (error) {
        console.log(`❌ FAIL: reservations - ${error.message}`);
      } else {
        console.log(`✅ PASS: reservations existe (${count} réservations)`);
      }
    } catch (e: any) {
      console.log(`❌ FAIL: reservations - ${e.message}`);
    }

    // Test 5: Tester insertion chat_messages
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .insert({
          sender_id: "test-123",
          sender_name: "Test",
          sender_initials: "T",
          content: "Test",
          conversation_id: "general",
          receiver_id: null,
        })
        .select();

      if (error) {
        console.log(`❌ FAIL: Insertion chat_messages - ${error.message}`);
      } else {
        if (data?.[0]?.id) {
          await supabase
            .from("chat_messages")
            .delete()
            .eq("id", data[0].id);
        }
        console.log("✅ PASS: Insertion chat_messages fonctionnelle");
      }
    } catch (e: any) {
      console.log(`❌ FAIL: Insertion chat_messages - ${e.message}`);
    }

    // Test 6: Tester insertion reservations
    try {
      const { data, error } = await supabase
        .from("reservations")
        .insert({
          user_id: "test-user-123",
          vehicle_id: "test-vehicle-123",
          vehicle_name: "Test",
          user_name: "Test",
          user_email: "test@test.com",
          destination: "Test",
          purpose: "Test",
          need_driver: false,
          start_date: new Date().toISOString(),
          end_date: new Date().toISOString(),
          status: "pending",
        })
        .select();

      if (error) {
        console.log(`❌ FAIL: Insertion reservations - ${error.message}`);
      } else {
        if (data?.[0]?.id) {
          await supabase
            .from("reservations")
            .delete()
            .eq("id", data[0].id);
        }
        console.log("✅ PASS: Insertion reservations fonctionnelle");
      }
    } catch (e: any) {
      console.log(`❌ FAIL: Insertion reservations - ${e.message}`);
    }

  } catch (error: any) {
    console.log(`❌ FAIL: ${error.message}`);
  }

  console.log("=" + "=".repeat(70));
  console.log("\n✅ Diagnostic terminé!\n");
}

runDiagnostics().catch(console.error);
