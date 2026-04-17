import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

interface TriggerInfo {
  name: string;
  event: string;
  timing: string;
  statement?: string;
}

interface RLSPolicy {
  name: string;
  type: string;
  roles: string;
  definition?: string;
}

async function checkAuthUsersTriggers() {
  console.log("\n" + "=".repeat(80));
  console.log("🔍 DIAGNOSTIC: Triggers, RLS, et Contraintes sur auth.users");
  console.log("=".repeat(80) + "\n");

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.log("❌ ERREUR: Variables d'environnement manquantes");
    console.log(`   SUPABASE_URL: ${SUPABASE_URL ? "✓" : "✗"}`);
    console.log(`   SUPABASE_KEY: ${SUPABASE_KEY ? "✓" : "✗"}`);
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  // Dictionnaire pour stocker les résultats
  let summaryReport = {
    triggers: [] as TriggerInfo[],
    rlsPolicies: [] as RLSPolicy[],
    constraints: [] as any[],
    functions: [] as any[],
    errors: [] as string[]
  };

  console.log("📋 VÉRIFICATION 1: Tous les triggers sur auth.users");
  console.log("-".repeat(80));
  
  try {
    const { data: triggers, error: triggersError } = await supabase.rpc(
      "get_triggers_on_table",
      { table_schema: "auth", table_name: "users" }
    );

    if (triggersError?.message?.includes("does not exist")) {
      console.log("⚠️  Fonction RPC 'get_triggers_on_table' n'existe pas");
      console.log("   → Utilisation de requête SQL directe...\n");
      
      // Requête SQL directe pour les triggers
      const { data: sqlTriggers, error: sqlError } = await supabase.rpc(
        "exec_sql",
        {
          query: `
            SELECT 
              trigger_name,
              event_manipulation,
              event_object_schema,
              event_object_table,
              action_statement
            FROM information_schema.triggers
            WHERE event_object_schema = 'auth' 
              AND event_object_table = 'users'
            ORDER BY trigger_name;
          `
        }
      ).catch(() => ({ data: null, error: { message: "RPC exec_sql failed" } }));

      if (sqlError) {
        console.log(`⚠️  Impossible d'interroger via RPC. Tentative de connexion directe...\n`);
      } else if (sqlTriggers && sqlTriggers.length > 0) {
        console.log(`✅ Triggers trouvés: ${sqlTriggers.length}\n`);
        sqlTriggers.forEach((t: any, i: number) => {
          console.log(`   ${i + 1}. ${t.trigger_name}`);
          console.log(`      Événement: ${t.event_manipulation}`);
          console.log(`      Table: ${t.event_object_schema}.${t.event_object_table}`);
          console.log(`      Action: ${t.action_statement?.substring(0, 100)}...\n`);
        });
      }
    } else if (triggersError) {
      console.log(`⚠️  Erreur: ${triggersError.message}`);
    } else if (triggers && triggers.length > 0) {
      console.log(`✅ Triggers trouvés: ${triggers.length}\n`);
      triggers.forEach((t: any, i: number) => {
        console.log(`   ${i + 1}. ${t.trigger_name}`);
        console.log(`      Événement: ${t.event_manipulation}`);
        console.log(`      Table: ${t.event_object_schema}.${t.event_object_table}`);
        console.log(`      Action: ${t.action_statement?.substring(0, 100)}...\n`);
      });
    } else {
      console.log("⚠️  Aucun trigger trouvé (résultat vide)\n");
    }
  } catch (e: any) {
    console.log(`❌ Exception: ${e.message}\n`);
  }

  console.log("📋 VÉRIFICATION 2: Politiques RLS (Row Level Security) sur auth.users");
  console.log("-".repeat(80));
  
  try {
    const { data: rlsPolicies, error: rlsError } = await supabase.rpc(
      "get_rls_policies",
      { table_schema: "auth", table_name: "users" }
    ).catch(() => ({ data: null, error: { message: "RPC not available" } }));

    if (rlsError?.message?.includes("does not exist") || rlsError?.message?.includes("RPC")) {
      console.log("⚠️  Fonction RPC 'get_rls_policies' n'existe pas");
      console.log("   → Vérification manuelle via SQL...\n");
      
      const { data: rlsData, error: rlsSqlError } = await supabase.rpc(
        "exec_sql",
        {
          query: `
            SELECT 
              schemaname,
              tablename,
              policyname,
              permissive,
              roles,
              qual,
              with_check
            FROM pg_policies
            WHERE schemaname = 'auth' 
              AND tablename = 'users';
          `
        }
      ).catch(() => ({ data: null, error: { message: "SQL failed" } }));

      if (rlsSqlError) {
        console.log("⚠️  Impossible de récupérer les politiques RLS via SQL\n");
      } else if (rlsData && rlsData.length > 0) {
        console.log(`✅ Politiques RLS trouvées: ${rlsData.length}\n`);
        rlsData.forEach((p: any, i: number) => {
          console.log(`   ${i + 1}. ${p.policyname}`);
          console.log(`      Type: ${p.permissive ? "PERMISSIVE" : "RESTRICTIVE"}`);
          console.log(`      Rôles: ${p.roles}`);
          console.log(`      Condition (USING): ${p.qual || "N/A"}`);
          console.log(`      Condition (WITH CHECK): ${p.with_check || "N/A"}\n`);
        });
      } else {
        console.log("✅ Aucune politique RLS trouvée (table sans restriction)\n");
      }
    } else if (rlsError) {
      console.log(`⚠️  Erreur RLS: ${rlsError.message}\n`);
    } else if (rlsPolicies && rlsPolicies.length > 0) {
      console.log(`✅ Politiques RLS trouvées: ${rlsPolicies.length}\n`);
      rlsPolicies.forEach((p: any, i: number) => {
        console.log(`   ${i + 1}. ${p.policyname}`);
        console.log(`      Type: ${p.permissive ? "PERMISSIVE" : "RESTRICTIVE"}`);
        console.log(`      Rôles: ${p.roles}`);
        console.log(`      Condition: ${p.qual || "N/A"}\n`);
      });
    } else {
      console.log("✅ Aucune politique RLS trouvée (table sans restriction)\n");
    }
  } catch (e: any) {
    console.log(`❌ Exception RLS: ${e.message}\n`);
  }

  console.log("📋 VÉRIFICATION 3: Contraintes et Index sur auth.users");
  console.log("-".repeat(80));
  
  try {
    const { data: constraints, error: constraintsError } = await supabase.rpc(
      "get_table_constraints",
      { table_schema: "auth", table_name: "users" }
    ).catch(() => ({ data: null, error: { message: "RPC not available" } }));

    if (constraintsError?.message?.includes("does not exist") || constraintsError?.message?.includes("RPC")) {
      console.log("⚠️  Fonction RPC 'get_table_constraints' n'existe pas\n");
      
      try {
        const { data: constraintsData, error: constraintsSqlError } = await supabase.rpc(
          "exec_sql",
          {
            query: `
              SELECT 
                constraint_name,
                constraint_type,
                column_name
              FROM information_schema.constraint_column_usage
              WHERE table_schema = 'auth' 
                AND table_name = 'users'
              ORDER BY constraint_name;
            `
          }
        ).catch(() => ({ data: null, error: { message: "SQL failed" } }));

        if (constraintsSqlError) {
          console.log("⚠️  Impossible de récupérer les contraintes via SQL\n");
        } else if (constraintsData && constraintsData.length > 0) {
          console.log(`✅ Contraintes trouvées: ${constraintsData.length}\n`);
          const grouped = new Map();
          constraintsData.forEach((c: any) => {
            const key = c.constraint_name;
            if (!grouped.has(key)) {
              grouped.set(key, { type: c.constraint_type, columns: [] });
            }
            grouped.get(key).columns.push(c.column_name);
          });
          
          let idx = 1;
          grouped.forEach((value, key) => {
            console.log(`   ${idx}. ${key}`);
            console.log(`      Type: ${value.type}`);
            console.log(`      Colonnes: ${value.columns.join(", ")}\n`);
            idx++;
          });
        } else {
          console.log("✅ Aucune contrainte trouvée\n");
        }
      } catch (e: any) {
        console.log(`⚠️  Erreur lors de la vérification des contraintes: ${e.message}\n`);
      }
    } else if (constraintsError) {
      console.log(`⚠️  Erreur: ${constraintsError.message}\n`);
    } else if (constraints && constraints.length > 0) {
      console.log(`✅ Contraintes trouvées: ${constraints.length}\n`);
      constraints.forEach((c: any, i: number) => {
        console.log(`   ${i + 1}. ${c.constraint_name}`);
        console.log(`      Type: ${c.constraint_type}`);
        console.log(`      Colonnes: ${c.column_name}\n`);
      });
    } else {
      console.log("✅ Aucune contrainte trouvée\n");
    }
  } catch (e: any) {
    console.log(`❌ Exception: ${e.message}\n`);
  }

  console.log("📋 VÉRIFICATION 4: Informations générales sur la table auth.users");
  console.log("-".repeat(80));
  
  try {
    // Vérifier si la table existe et accessible
    const { data: testData, error: testError } = await supabase
      .from("auth.users")
      .select("id", { count: "exact", head: true });

    if (testError) {
      console.log(`⚠️  Erreur d'accès à auth.users: ${testError.message}`);
      console.log("   → La table auth.users existe mais n'est pas accessible avec les clés actuelles\n");
    } else {
      console.log(`✅ Table auth.users accessible`);
      console.log(`   État: Lecture possible avec les clés actuelles\n`);
    }
  } catch (e: any) {
    console.log(`❌ Exception: ${e.message}\n`);
  }

  console.log("📋 VÉRIFICATION 5: Fonctions (Functions) sur auth.users");
  console.log("-".repeat(80));
  
  try {
    const { data: functions, error: functionsError } = await supabase.rpc(
      "get_functions",
      { schema_name: "auth" }
    ).catch(() => ({ data: null, error: { message: "RPC not available" } }));

    if (functionsError?.message?.includes("does not exist") || functionsError?.message?.includes("RPC")) {
      console.log("⚠️  Fonction RPC 'get_functions' n'existe pas\n");
    } else if (functionsError) {
      console.log(`⚠️  Erreur: ${functionsError.message}\n`);
    } else if (functions && functions.length > 0) {
      const authFunctions = functions.filter((f: any) => 
        f.function_name?.toLowerCase().includes('user') || 
        f.routine_definition?.toLowerCase().includes('auth.users')
      );
      
      if (authFunctions.length > 0) {
        console.log(`✅ Fonctions liées à auth.users trouvées: ${authFunctions.length}\n`);
        authFunctions.forEach((f: any, i: number) => {
          console.log(`   ${i + 1}. ${f.function_name}`);
          console.log(`      Schéma: ${f.routine_schema}`);
          console.log(`      Retour: ${f.data_type}\n`);
        });
      } else {
        console.log("ℹ️  Aucune fonction liée à auth.users trouvée\n");
      }
    } else {
      console.log("ℹ️  Aucune fonction trouvée\n");
    }
  } catch (e: any) {
    console.log(`⚠️  Exception: ${e.message}\n`);
  }

  console.log("=".repeat(80));
  console.log("✅ DIAGNOSTIC COMPLÉTÉ");
  console.log("=".repeat(80) + "\n");
}

checkAuthUsersTriggers();
