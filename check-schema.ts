import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function checkSchema() {
  console.log("🔍 Vérifier le schéma de reservations\n");
  
  const { data, error } = await supabase
    .rpc('get_table_columns', { 
      table_name: 'reservations',
      schema_name: 'public'
    })
    .catch(() => ({ data: null, error: { message: 'RPC not available' } }));
  
  if (error || !data) {
    console.log("⚠️ RPC not available, using SQL query manually");
    console.log("Exécute cette requête dans Supabase SQL Editor:");
    console.log(`
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'reservations'
ORDER BY ordinal_position;
    `);
  } else {
    console.log("✅ Colonnes de reservations:");
    data.forEach((col: any) => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
  }
}

checkSchema().catch(console.error);
