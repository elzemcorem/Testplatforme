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

async function checkAllowedUsers() {
  console.log("📋 Vérification de la table allowed_users...\n");

  try {
    // Récupérer tous les utilisateurs autorisés
    const { data, error } = await supabase
      .from("allowed_users")
      .select("id, noms, email, role");

    if (error) {
      console.error("❌ Erreur lors de la lecture:", error);
      return;
    }

    console.log("📊 Utilisateurs dans allowed_users:");
    console.log("=====================================");
    
    if (!data || data.length === 0) {
      console.log("❌ AUCUN utilisateur trouvé!");
    } else {
      data.forEach((user, index) => {
        console.log(`\n${index + 1}. ID: ${user.id}`);
        console.log(`   Nom: ${user.noms}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Rôle: ${user.role}`);
      });
    }

    // Vérifier l'email spécifique
    console.log("\n\n🔍 Recherche de: atognon@beninpetro@gmail.com");
    console.log("=====================================");
    
    const testEmail = "atognon@beninpetro@gmail.com";
    const { data: found, error: searchError } = await supabase
      .from("allowed_users")
      .select("*")
      .eq("email", testEmail)
      .single();

    if (searchError) {
      if (searchError.code === 'PGRST116') {
        console.log(`❌ Email "${testEmail}" n'existe PAS dans allowed_users`);
        console.log("\n💡 SUGGESTIONS:");
        console.log("   1. Vérifier l'email (il a deux @?)");
        console.log("   2. Ajouter l'email à la table allowed_users");
      } else {
        console.error("❌ Erreur:", searchError);
      }
    } else if (found) {
      console.log(`✅ Email trouvé!`);
      console.log(`   Nom: ${found.noms}`);
      console.log(`   Rôle: ${found.role}`);
    }

  } catch (error) {
    console.error("❌ Exception:", error);
  }
}

checkAllowedUsers();
