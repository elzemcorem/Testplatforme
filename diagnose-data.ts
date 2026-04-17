import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function diagnose() {
  console.log("🔍 DIAGNOSTIC - Vérifier les données\n");
  
  // 1. Vérifier les réservations en BD
  const { data: reservations, error: resError } = await supabase
    .from("reservations")
    .select("*");
  
  if (resError) {
    console.error("❌ Erreur de lecture réservations:", resError);
  } else {
    console.log("📋 Réservations en BD:", reservations?.length || 0);
    if (reservations && reservations.length > 0) {
      console.log("\n🔎 Détails de toutes les réservations:");
      reservations.forEach((res, idx) => {
        console.log(`\nRéservation ${idx + 1}:`);
        console.log(`  - ID: ${res.id}`);
        console.log(`  - user_id: ${res.user_id}`);
        console.log(`  - user_name: ${res.user_name}`);
        console.log(`  - user_email: ${res.user_email}`);
        console.log(`  - status: ${res.status}`);
        console.log(`  - vehicle_id: ${res.vehicle_id}`);
      });
    }
  }
  
  // 2. Vérifier les users Auth
  console.log("\n\n📝 Vérifier les users Supabase Auth:");
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
  
  if (usersError) {
    console.error("❌ Erreur de lecture users Auth:", usersError);
  } else {
    console.log(`✅ ${users?.users?.length || 0} users trouvés:`);
    users?.users?.forEach((u) => {
      console.log(`  - Email: ${u.email}`);
      console.log(`    ID: ${u.id}`);
      console.log(`    Email confirmed: ${u.email_confirmed_at ? '✅' : '❌'}`);
    });
  }
  
  // 3. Vérifier allowed_users
  console.log("\n\n🔐 Vérifier allowed_users:");
  const { data: allowedUsers, error: allowedError } = await supabase
    .from("allowed_users")
    .select("*");
  
  if (allowedError) {
    console.error("❌ Erreur:", allowedError);
  } else {
    console.log(`✅ ${allowedUsers?.length || 0} users autorisés:`);
    allowedUsers?.forEach((u) => {
      console.log(`  - Email: ${u.email}, Role: ${u.role}`);
    });
  }
}

diagnose().catch(console.error);
