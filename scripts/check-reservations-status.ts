import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function check() {
  console.log("📊 État actuel des réservations en BD:\n");
  
  const { data: reservations } = await supabase
    .from("reservations")
    .select("*");
  
  if (!reservations || reservations.length === 0) {
    console.log("❌ Aucune réservation trouvée");
    return;
  }
  
  reservations.forEach((r: any) => {
    console.log(`Réservation ${r.id.substring(0, 8)}...`);
    console.log(`  user_id: ${r.user_id}`);
    console.log(`  status: ${r.status}`);
    console.log(`  validated_by: ${r.validated_by || "NULL"}`);
    console.log(`  cancelled_by: ${r.cancelled_by || "NULL"}`);
    console.log();
  });
}

check().catch(console.error);
