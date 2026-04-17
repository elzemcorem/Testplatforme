import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";

async function inspectAuthUsers() {
  console.log("\n" + "═".repeat(90));
  console.log("🔍 DIAGNOSTIC COMPLET: auth.users - Triggers, RLS, et Contraintes");
  console.log("═".repeat(90) + "\n");

  if (!SUPABASE_URL) {
    console.log("❌ ERREUR: SUPABASE_URL manquant");
    return;
  }

  if (!SUPABASE_SERVICE_KEY && !SUPABASE_ANON_KEY) {
    console.log("❌ ERREUR: Clé Supabase manquante");
    console.log("   SUPABASE_SERVICE_ROLE_KEY ou VITE_SUPABASE_ANON_KEY requise");
    return;
  }

  // Utiliser la clé service si disponible, sinon la clé anon
  const apiKey = SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY;
  const supabase = createClient(SUPABASE_URL, apiKey);

  // Résumé
  let summary = {
    totalTriggers: 0,
    totalRLSPolicies: 0,
    totalConstraints: 0,
    triggers: [] as any[],
    rlsPolicies: [] as any[],
    constraints: [] as any[]
  };

  console.log("📋 ÉTAPE 1: Vérification de l'accès à auth.users");
  console.log("─".repeat(90));
  try {
    const { data, error } = await supabase
      .from("auth.users")
      .select("id", { count: "exact", head: true });

    if (error) {
      console.log(`⚠️  Accès limité: ${error.message}`);
      console.log("   → Certaines informations détaillées pourraient ne pas être disponibles\n");
    } else {
      console.log("✅ Accès confirmé à auth.users\n");
    }
  } catch (e: any) {
    console.log(`⚠️  Exception: ${e.message}\n`);
  }

  console.log("\n📋 ÉTAPE 2: Recherche des TRIGGERS sur auth.users");
  console.log("─".repeat(90));
  
  try {
    // Requête directe à la base via une table que nous pouvons interroger
    // Note: Pour les triggers, on essaie de les lire via information_schema
    let triggersData, triggersError;
    try {
      const result = await supabase.rpc(
        "get_schema_triggers",
        { schema_name: "auth", table_name: "users" }
      );
      triggersData = result.data;
      triggersError = result.error;
    } catch (e) {
      console.log("⚠️  RPC 'get_schema_triggers' non disponible");
      triggersError = { message: "RPC not available" };
      triggersData = null;
    }

    if (triggersData) {
      console.log(`✅ ${triggersData.length} trigger(s) trouvé(s)\n`);
      
      triggersData.forEach((trigger: any, idx: number) => {
        console.log(`   ${idx + 1}. TRIGGER: ${trigger.trigger_name}`);
        console.log(`      ├─ Événement: ${trigger.event_manipulation} ${trigger.action_timing}`);
        console.log(`      ├─ Table: ${trigger.event_object_schema}.${trigger.event_object_table}`);
        console.log(`      ├─ Fonction: ${trigger.trigger_function}`);
        if (trigger.action_statement) {
          console.log(`      └─ Action: ${trigger.action_statement.substring(0, 80)}...`);
        }
        console.log();
      });
      
      summary.totalTriggers = triggersData.length;
      summary.triggers = triggersData;
    } else if (triggersError?.message?.includes("not available")) {
      console.log("⚠️  Impossible de vérifier les triggers via RPC");
      console.log("   → Il se peut qu'il y ait des triggers non visibles\n");
    } else if (triggersError) {
      console.log(`⚠️  Erreur: ${triggersError.message}\n`);
    } else {
      console.log("ℹ️  Aucun trigger trouvé ou RPC non configuré\n");
    }
  } catch (e: any) {
    console.log(`❌ Exception: ${e.message}\n`);
  }

  console.log("\n📋 ÉTAPE 3: Vérification des POLITIQUES RLS (Row Level Security)");
  console.log("─".repeat(90));
  
  try {
    let rlsData, rlsError;
    try {
      const result = await supabase.rpc(
        "get_schema_policies",
        { schema_name: "auth", table_name: "users" }
      );
      rlsData = result.data;
      rlsError = result.error;
    } catch (e) {
      console.log("⚠️  RPC 'get_schema_policies' non disponible");
      rlsError = { message: "RPC not available" };
      rlsData = null;
    }

    if (rlsData) {
      console.log(`✅ ${rlsData.length} politique(s) RLS trouvée(s)\n`);
      
      rlsData.forEach((policy: any, idx: number) => {
        console.log(`   ${idx + 1}. POLITIQUE: ${policy.policyname}`);
        console.log(`      ├─ Type: ${policy.permissive ? "PERMISSIVE" : "RESTRICTIVE"}`);
        console.log(`      ├─ Rôles: ${policy.roles || "PUBLIC"}`);
        console.log(`      ├─ USING: ${policy.qual || "N/A"}`);
        console.log(`      └─ WITH CHECK: ${policy.with_check || "N/A"}`);
        console.log();
      });
      
      summary.totalRLSPolicies = rlsData.length;
      summary.rlsPolicies = rlsData;
    } else if (rlsError?.message?.includes("not available")) {
      console.log("⚠️  Impossible de vérifier les politiques RLS via RPC");
      console.log("   → RLS pourrait être activé ou désactivé, impossible à confirmer\n");
    } else if (rlsError) {
      console.log(`⚠️  Erreur: ${rlsError.message}\n`);
    } else {
      console.log("✅ Aucune politique RLS trouvée (table sans restriction)\n");
    }
  } catch (e: any) {
    console.log(`❌ Exception: ${e.message}\n`);
  }

  console.log("\n📋 ÉTAPE 4: Vérification des CONTRAINTES et INDEX");
  console.log("─".repeat(90));
  
  try {
    let constraintsData, constraintsError;
    try {
      const result = await supabase.rpc(
        "get_table_constraints",
        { schema_name: "auth", table_name: "users" }
      );
      constraintsData = result.data;
      constraintsError = result.error;
    } catch (e) {
      console.log("⚠️  RPC 'get_table_constraints' non disponible");
      constraintsError = { message: "RPC not available" };
      constraintsData = null;
    }

    if (constraintsData && constraintsData.length > 0) {
      console.log(`✅ ${constraintsData.length} contrainte(s) trouvée(s)\n`);
      
      const grouped = new Map<string, any>();
      
      constraintsData.forEach((constraint: any) => {
        const key = constraint.constraint_name;
        if (!grouped.has(key)) {
          grouped.set(key, {
            name: key,
            type: constraint.constraint_type,
            columns: [],
            definition: constraint.constraint_definition
          });
        }
        if (constraint.column_name) {
          grouped.get(key).columns.push(constraint.column_name);
        }
      });
      
      let idx = 1;
      grouped.forEach((constraint) => {
        console.log(`   ${idx}. CONTRAINTE: ${constraint.name}`);
        console.log(`      ├─ Type: ${constraint.type}`);
        console.log(`      ├─ Colonnes: ${constraint.columns.join(", ")}`);
        if (constraint.definition) {
          console.log(`      └─ Définition: ${constraint.definition.substring(0, 80)}...`);
        }
        console.log();
        idx++;
      });
      
      summary.totalConstraints = constraintsData.length;
      summary.constraints = constraintsData;
    } else if (constraintsError?.message?.includes("not available")) {
      console.log("⚠️  Impossible de vérifier les contraintes via RPC\n");
    } else if (constraintsError) {
      console.log(`⚠️  Erreur: ${constraintsError.message}\n`);
    } else {
      console.log("ℹ️  Aucune contrainte supplémentaire trouvée\n");
    }
  } catch (e: any) {
    console.log(`❌ Exception: ${e.message}\n`);
  }

  console.log("\n📋 ÉTAPE 5: Vérification des FONCTIONS PERSONNALISÉES");
  console.log("─".repeat(90));
  
  try {
    let functionsData, functionsError;
    try {
      const result = await supabase.rpc(
        "get_schema_functions",
        { schema_name: "auth" }
      );
      functionsData = result.data;
      functionsError = result.error;
    } catch (e) {
      console.log("⚠️  RPC 'get_schema_functions' non disponible");
      functionsError = { message: "RPC not available" };
      functionsData = null;
    }

    if (functionsData && functionsData.length > 0) {
      const relevantFuncs = functionsData.filter((f: any) =>
        f.routine_definition?.toLowerCase().includes("users") ||
        f.function_name?.toLowerCase().includes("user")
      );
      
      if (relevantFuncs.length > 0) {
        console.log(`✅ ${relevantFuncs.length} fonction(s) liée(s) à auth.users trouvée(s)\n`);
        
        relevantFuncs.forEach((func: any, idx: number) => {
          console.log(`   ${idx + 1}. FONCTION: ${func.function_name}`);
          console.log(`      ├─ Schéma: ${func.routine_schema}`);
          console.log(`      ├─ Retour: ${func.data_type}`);
          if (func.routine_definition) {
            console.log(`      └─ Définition: ${func.routine_definition.substring(0, 80)}...`);
          }
          console.log();
        });
      } else {
        console.log("ℹ️  Aucune fonction personnalisée liée à auth.users\n");
      }
    } else {
      console.log("ℹ️  Aucune fonction trouvée\n");
    }
  } catch (e: any) {
    console.log(`⚠️  Exception: ${e.message}\n`);
  }

  console.log("\n" + "═".repeat(90));
  console.log("📊 RÉSUMÉ FINAL");
  console.log("═".repeat(90));
  console.log(`
  ✅ Triggers trouvés:        ${summary.totalTriggers}
  ✅ Politiques RLS:           ${summary.totalRLSPolicies}
  ✅ Contraintes:              ${summary.totalConstraints}
  
  📌 ATTENTION: Ces chiffres dépendent de la disponibilité des RPC Supabase.
     Si les RPC ne sont pas configurés, les résultats peuvent être incomplets.
  `);

  console.log("\n💡 INTERPRÉTATION:");
  console.log("─".repeat(90));
  
  if (summary.totalTriggers > 0) {
    console.log(`🚨 ${summary.totalTriggers} trigger(s) trouvé(s) sur auth.users`);
    console.log("   → Vérifiez que ces triggers n'interfèrent pas avec la création d'utilisateurs");
    summary.triggers.forEach((t: any) => {
      console.log(`      • ${t.trigger_name}: ${t.event_manipulation}`);
    });
  } else {
    console.log("✅ Aucun trigger détecté sur auth.users");
  }
  
  console.log();
  
  if (summary.totalRLSPolicies > 0) {
    console.log(`🚨 ${summary.totalRLSPolicies} politique(s) RLS trouvée(s)`);
    console.log("   → Les RLS pourraient bloquer les opérations non autorisées");
    summary.rlsPolicies.forEach((p: any) => {
      console.log(`      • ${p.policyname}: ${p.permissive ? "PERMISSIVE" : "RESTRICTIVE"}`);
    });
  } else {
    console.log("✅ Aucune politique RLS trouvée (ou RLS désactivé)");
  }

  console.log("\n═".repeat(90) + "\n");
}

inspectAuthUsers().catch(console.error);
