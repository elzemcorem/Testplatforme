import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";

// Générer un UUID v4 simple
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function inspectSchema() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  console.log("🔍 Inspection du schéma Supabase\n");

  const testUUID = generateUUID();
  console.log(`Test UUID généré: ${testUUID}\n`);

  // Étape 1: Créer l'utilisateur test d'abord
  console.log("📌 Étape 1: Créer l'utilisateur test...");
  try {
    // Essayer d'insérer directement dans profiles
    const { data: createUser, error: userError } = await supabase
      .from("profiles")
      .insert({
        id: testUUID,
        email: `test-${testUUID.substring(0, 8)}@test.com`,
        name: "Test User",
      })
      .select();

    if (userError) {
      console.log("⚠️ Impossible de créer dans profiles:", userError.message);
      console.log("   Essai avec auth.users...");
    } else {
      console.log("✅ Utilisateur créé dans profiles");
    }
  } catch (e: any) {
    console.log("⚠️ Erreur création utilisateur:", e.message);
  }

  // Étape 2: Tester insertion chat_messages
  try {
    console.log("\n📤 Étape 2: Tentative insertion chat_messages...");
    const testInsert = await supabase
      .from("chat_messages")
      .insert({
        sender_id: testUUID,
        sender_name: "test",
        sender_initials: "T",
        content: "test",
        conversation_id: "general",
        receiver_id: null,
      })
      .select();
    
    if (testInsert.error) {
      console.log("❌ chat_messages error:", testInsert.error.message);
      console.log("   Code:", testInsert.error.code);
    } else {
      console.log("✅ chat_messages: insertion réussie!");
      if (testInsert.data && testInsert.data[0]) {
        console.log("📋 Colonnes retournées:", Object.keys(testInsert.data[0]));
        // Nettoyer
        await supabase.from("chat_messages").delete().eq("id", testInsert.data[0].id);
      }
    }
  } catch (e: any) {
    console.log("❌ Erreur chat_messages:", e.message);
  }

  // Étape 3: Tester insertion reservations
  try {
    console.log("\n📤 Étape 3: Tentative insertion reservations...");
    const testInsert = await supabase
      .from("reservations")
      .insert({
        user_id: testUUID,
        vehicle_id: testUUID,
        vehicle_name: "test",
        user_name: "test",
        user_email: "test@test.com",
        destination: "test",
        purpose: "test",
        need_driver: false,
        start_date: new Date().toISOString(),
        end_date: new Date().toISOString(),
        status: "pending",
      })
      .select();

    if (testInsert.error) {
      console.log("❌ reservations error:", testInsert.error.message);
      console.log("   Code:", testInsert.error.code);
    } else {
      console.log("✅ reservations: insertion réussie!");
      if (testInsert.data && testInsert.data[0]) {
        console.log("📋 Colonnes retournées:", Object.keys(testInsert.data[0]));
        // Nettoyer
        await supabase.from("reservations").delete().eq("id", testInsert.data[0].id);
      }
    }
  } catch (e: any) {
    console.log("❌ Erreur reservations:", e.message);
  }

  console.log("\n✅ Inspection terminée!");
}

inspectSchema().catch(console.error);
