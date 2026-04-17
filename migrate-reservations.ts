import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Variables Supabase manquantes");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrateReservations() {
  console.log("🔄 Migration des réservations localStorage → Supabase\n");

  try {
    // Vérifier s'il y a des réservations dans Supabase
    const { data: existing, error: readError } = await supabase
      .from("reservations")
      .select("id");

    if (readError) {
      console.error("❌ Erreur lors de la lecture des réservations:", readError);
      return;
    }

    console.log(`📊 Réservations existantes dans Supabase: ${existing?.length || 0}`);
    
    // Créer des données de test
    const testReservations = [
      {
        user_id: "550e8400-e29b-41d4-a716-446655440001",
        user_name: "Test User 1",
        user_email: "test1@example.com",
        vehicle_id: "550e8400-e29b-41d4-a716-446655440101",
        vehicle_name: "Vehicle 1",
        destination: "Paris",
        purpose: "Business trip",
        need_driver: false,
        start_date: new Date("2026-05-01T09:00:00").toISOString(),
        end_date: new Date("2026-05-05T17:00:00").toISOString(),
        status: "pending",
        cancel_reason: null,
        cancelled_by: null,
        validated_by: null,
        completed_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        user_id: "550e8400-e29b-41d4-a716-446655440002",
        user_name: "Test User 2",
        user_email: "test2@example.com",
        vehicle_id: "550e8400-e29b-41d4-a716-446655440102",
        vehicle_name: "Vehicle 2",
        destination: "Lyon",
        purpose: "Client meeting",
        need_driver: true,
        start_date: new Date("2026-04-20T08:00:00").toISOString(),
        end_date: new Date("2026-04-22T18:00:00").toISOString(),
        status: "validated",
        cancel_reason: null,
        cancelled_by: null,
        validated_by: "Controller Name",
        completed_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    console.log(`\n📤 Insertion de ${testReservations.length} réservations de test...\n`);

    for (const res of testReservations) {
      const { data, error } = await supabase
        .from("reservations")
        .insert([res])
        .select()
        .single();

      if (error) {
        console.error(`❌ Erreur pour ${res.vehicle_name}:`, error.message);
      } else {
        console.log(`✅ ${res.vehicle_name} - Réservation créée`);
      }
    }

    console.log("\n✅ Migration terminée!");
    
    // Vérifier le total
    const { data: final } = await supabase
      .from("reservations")
      .select("id");
    
    console.log(`\n📊 Total réservations dans Supabase: ${final?.length || 0}`);

  } catch (error) {
    console.error("❌ Exception:", error);
  }
}

migrateReservations();
