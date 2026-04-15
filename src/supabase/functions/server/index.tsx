import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Configuration CORS et logging
app.use("*", cors());
app.use("*", logger(console.log));

// Client Supabase pour opérations admin
const getSupabaseClient = () => {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
};

// Vérifier si c'est un token démo (mode local)
const isDemoToken = (token: string | undefined): boolean => {
  return token?.startsWith('demo_token_') ?? false;
};

// Extraire l'user ID d'un token démo
const getUserIdFromDemoToken = (token: string): string => {
  return token.replace('demo_token_', '');
};

// Helper pour vérifier l'authentification (supporte tokens démo et Supabase)
const authenticateUser = async (accessToken: string | undefined): Promise<{ userId: string | null, error: boolean }> => {
  if (!accessToken) {
    console.log("authenticateUser: No token provided");
    return { userId: null, error: true };
  }

  // Mode démo : accepter les tokens demo
  if (isDemoToken(accessToken)) {
    const userId = getUserIdFromDemoToken(accessToken);
    console.log("authenticateUser: Demo token detected, userId:", userId);
    return { userId, error: false };
  }

  // Mode Supabase
  console.log("authenticateUser: Supabase token detected, verifying...");
  try {
    const supabase = getSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      console.log("authenticateUser: Supabase auth failed:", authError);
      return { userId: null, error: true };
    }

    console.log("authenticateUser: Supabase auth successful, userId:", user.id);
    return { userId: user.id, error: false };
  } catch (e) {
    console.log("authenticateUser: Exception during Supabase auth:", e);
    return { userId: null, error: true };
  }
};

// ============= AUTHENTICATION =============

// Inscription d'un nouvel utilisateur
app.post("/make-server-f44f03da/auth/signup", async (c) => {
  try {
    const { email, password, name, role } = await c.req.json();
    
    const supabase = getSupabaseClient();
    
    // Vérifier si l'utilisateur existe déjà
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const userExists = existingUsers?.users?.some(u => u.email === email);
    
    if (userExists) {
      console.log(`❌ Signup failed: User with email ${email} already exists`);
      return c.json({ error: "A user with this email address has already been registered" }, 422);
    }
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { 
        name,
        role,
        status: "active",
        initials: name.split(" ").map((n: string) => n[0]).join("").toUpperCase(),
      },
      email_confirm: true, // Auto-confirmer l'email car serveur email non configuré
    });

    if (error) {
      console.error("Signup error:", error);
      return c.json({ error: error.message }, 400);
    }

    console.log(`✅ Account created successfully for: ${email}`);
    return c.json({ user: data.user });
  } catch (error) {
    console.error("Signup error:", error);
    return c.json({ error: "Erreur lors de l'inscription" }, 500);
  }
});

// Connexion
app.post("/make-server-f44f03da/auth/signin", async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    console.log(`🔐 Signin request for: ${email}`);
    
    // Vérifier les variables d'environnement
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    console.log(`🔍 Environment check:`);
    console.log(`   - SUPABASE_URL: ${supabaseUrl ? 'SET ✅' : 'MISSING ❌'}`);
    console.log(`   - SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'SET ✅' : 'MISSING ❌'}`);
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error(`❌ Missing environment variables!`);
      return c.json({ error: "Server configuration error: Missing environment variables" }, 500);
    }
    
    // Utiliser le client ANON pour la connexion
    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
    
    // Essayer de se connecter
    const { data, error } = await supabaseAnon.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Signin error:", error);
      
      // Si l'erreur est "Invalid credentials", cela peut signifier:
      // 1. L'utilisateur n'existe pas -> on doit créer le compte
      // 2. Le mot de passe est incorrect -> on retourne une erreur
      
      console.log(`🔍 Checking if user exists: ${email}`);
      
      // Pour distinguer, on essaie de vérifier si l'utilisateur existe
      const supabaseAdmin = getSupabaseClient();
      
      try {
        // Lister tous les utilisateurs et chercher l'email
        console.log(`📋 Fetching user list from Supabase...`);
        const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (listError) {
          console.error(`❌ Error listing users:`, listError);
          return c.json({ error: `Failed to check user existence: ${listError.message}` }, 500);
        }
        
        console.log(`📊 Found ${listData?.users?.length || 0} total users`);
        const userExists = listData?.users?.some(u => u.email === email);
        console.log(`🔍 User ${email} exists: ${userExists}`);
        
        if (userExists) {
          // L'utilisateur existe, c'est donc un mauvais mot de passe
          console.error(`❌ Wrong password for existing account: ${email}`);
          return c.json({ 
            error: "Invalid login credentials",
            userExists: true,
            message: "Mot de passe incorrect pour ce compte existant"
          }, 400);
        } else {
          // L'utilisateur n'existe pas, on crée le compte automatiquement
          console.log(`📝 User not found, creating account for: ${email}`);
          
          const username = email.split('@')[0];
          const name = username;
          
          // Déterminer le rôle selon la logique :
          // - Admin : chiffre à la fin du username (ex: test1@...)
          // - Contrôleur : chiffre au milieu du username (ex: te1st@...)
          // - Utilisateur : pas de chiffre
          const lastChar = username[username.length - 1];
          let role = 'user';
          
          if (/\d/.test(lastChar)) {
            role = 'admin';
          } else if (/\d/.test(username.slice(0, -1))) {
            role = 'controller';
          }
          
          console.log(`📝 Determined role for ${email}: ${role} (username: ${username})`);
          
          const { data: newUserData, error: signupError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            user_metadata: { 
              name,
              role,
              initials: name.substring(0, 2).toUpperCase(),
              status: 'active'
            },
            email_confirm: true
          });
          
          if (signupError) {
            console.error("Auto-signup error:", signupError);
            return c.json({ error: signupError.message }, 400);
          }
          
          // Maintenant se connecter avec le nouveau compte
          const { data: loginData, error: loginError } = await supabaseAnon.auth.signInWithPassword({
            email,
            password,
          });
          
          if (loginError) {
            console.error("Auto-login error:", loginError);
            return c.json({ error: loginError.message }, 400);
          }
          
          console.log(`✅ Account auto-created and logged in: ${email}`);
          return c.json({ 
            user: loginData.user,
            session: loginData.session,
            accountCreated: true
          });
        }
      } catch (checkError) {
        console.error("Error checking user existence:", checkError);
        return c.json({ error: error.message }, 400);
      }
    }

    console.log(`✅ Login successful for: ${email}`);
    return c.json({ 
      user: data.user,
      session: data.session,
    });
  } catch (error) {
    console.error("Signin error:", error);
    return c.json({ error: "Erreur lors de la connexion" }, 500);
  }
});

// Vérifier l'utilisateur actuel
app.get("/make-server-f44f03da/auth/user", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    
    if (!accessToken) {
      return c.json({ error: "Non autorisé" }, 401);
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error) {
      return c.json({ error: error.message }, 401);
    }

    return c.json({ user: data.user });
  } catch (error) {
    console.error("Get user error:", error);
    return c.json({ error: "Erreur lors de la récupération de l'utilisateur" }, 500);
  }
});

// Réinitialiser tous les comptes (pour les tests)
app.post("/make-server-f44f03da/auth/reset-all", async (c) => {
  try {
    console.log("🔄 Resetting all user accounts...");
    
    const supabase = getSupabaseClient();
    
    // Lister tous les utilisateurs
    const { data: listData } = await supabase.auth.admin.listUsers();
    const users = listData?.users || [];
    
    console.log(`📋 Found ${users.length} user(s) to delete`);
    
    let deletedCount = 0;
    
    // Supprimer chaque utilisateur
    for (const user of users) {
      try {
        const { error } = await supabase.auth.admin.deleteUser(user.id);
        if (!error) {
          deletedCount++;
          console.log(`✅ Deleted user: ${user.email}`);
        } else {
          console.error(`❌ Failed to delete user ${user.email}:`, error);
        }
      } catch (err) {
        console.error(`❌ Error deleting user ${user.email}:`, err);
      }
    }
    
    console.log(`✅ Reset complete: ${deletedCount}/${users.length} user(s) deleted`);
    
    return c.json({ 
      success: true, 
      deletedCount,
      totalCount: users.length,
      message: `${deletedCount} compte(s) supprimé(s) avec succès`
    });
  } catch (error) {
    console.error("Reset error:", error);
    return c.json({ error: "Erreur lors de la réinitialisation" }, 500);
  }
});

// ============= RESERVATIONS =============

// Créer une réservation
app.post("/make-server-f44f03da/reservations", async (c) => {
  try {
    console.log("========== RESERVATION CREATE REQUEST ==========");
    const authHeader = c.req.header("Authorization");
    console.log("1️⃣ Authorization header:", authHeader ? authHeader.substring(0, 30) + '...' : '❌ MISSING');
    
    const accessToken = authHeader?.split(" ")[1];
    console.log("2️⃣ Extracted token:", accessToken?.substring(0, 30) + '...');
    console.log("3️⃣ Is demo token?", isDemoToken(accessToken));
    
    if (!accessToken) {
      console.log("❌ No access token provided");
      return c.json({ error: "Non autorisé - token manquant" }, 401);
    }

    const { userId, error } = await authenticateUser(accessToken);
    
    console.log("4️⃣ Authentication result:");
    console.log("   - userId:", userId);
    console.log("   - error:", error);
    
    if (error || !userId) {
      console.log("❌ Authentication failed");
      return c.json({ error: "Non autorisé - authentification échouée" }, 401);
    }

    const reservation = await c.req.json();
    console.log("5️⃣ Reservation data received:", { vehicleName: reservation.vehicleName, userName: reservation.userName });
    
    // Sauvegarder dans le KV store
    const reservationId = `reservation_${Date.now()}`;
    const reservationData = {
      id: reservationId,
      ...reservation,
      userId: userId,
      createdAt: new Date().toISOString(),
    };
    
    await kv.set(reservationId, reservationData);
    console.log("✅ Reservation saved to KV store:", reservationId);

    return c.json({ success: true, id: reservationId, reservation: reservationData });
  } catch (error) {
    console.error("❌ Create reservation error:", error);
    return c.json({ error: "Erreur lors de la création de la réservation: " + error.message }, 500);
  }
});

// Récupérer toutes les réservations
app.get("/make-server-f44f03da/reservations", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    
    if (!accessToken) {
      return c.json({ error: "Non autorisé" }, 401);
    }

    const { userId, error } = await authenticateUser(accessToken);
    if (error || !userId) {
      return c.json({ error: "Non autorisé" }, 401);
    }

    const reservations = await kv.getByPrefix("reservation_");
    return c.json({ reservations });
  } catch (error) {
    console.error("Get reservations error:", error);
    return c.json({ error: "Erreur lors de la récupération des réservations" }, 500);
  }
});

// Mettre à jour une réservation
app.put("/make-server-f44f03da/reservations/:id", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    
    if (!accessToken) {
      return c.json({ error: "Non autorisé" }, 401);
    }

    const { userId, error } = await authenticateUser(accessToken);
    if (error || !userId) {
      return c.json({ error: "Non autorisé" }, 401);
    }

    const id = c.req.param("id");
    const updates = await c.req.json();

    const existing = await kv.get(id);
    if (!existing) {
      return c.json({ error: "Réservation non trouvée" }, 404);
    }

    await kv.set(id, {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    return c.json({ success: true });
  } catch (error) {
    console.error("Update reservation error:", error);
    return c.json({ error: "Erreur lors de la mise à jour de la réservation" }, 500);
  }
});

// ============= MESSAGES CHAT =============

// Envoyer un message
app.post("/make-server-f44f03da/messages", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    
    if (!accessToken) {
      return c.json({ error: "Non autorisé" }, 401);
    }

    const { userId, error } = await authenticateUser(accessToken);
    if (error || !userId) {
      return c.json({ error: "Non autorisé" }, 401);
    }

    const message = await c.req.json();
    
    const messageId = `message_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await kv.set(messageId, {
      ...message,
      userId: userId,
      createdAt: new Date().toISOString(),
    });

    return c.json({ success: true, id: messageId });
  } catch (error) {
    console.error("Send message error:", error);
    return c.json({ error: "Erreur lors de l'envoi du message" }, 500);
  }
});

// Récupérer tous les messages
app.get("/make-server-f44f03da/messages", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    
    if (!accessToken) {
      return c.json({ error: "Non autorisé" }, 401);
    }

    const { userId, error } = await authenticateUser(accessToken);
    if (error || !userId) {
      return c.json({ error: "Non autorisé" }, 401);
    }

    const messages = await kv.getByPrefix("message_");
    return c.json({ messages });
  } catch (error) {
    console.error("Get messages error:", error);
    return c.json({ error: "Erreur lors de la récupération des messages" }, 500);
  }
});

// ============= CHECKLISTS =============

// Créer une checklist
app.post("/make-server-f44f03da/checklists", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    
    if (!accessToken) {
      return c.json({ error: "Non autorisé" }, 401);
    }

    const { userId, error } = await authenticateUser(accessToken);
    if (error || !userId) {
      return c.json({ error: "Non autorisé" }, 401);
    }

    const checklist = await c.req.json();
    
    const checklistId = `checklist_${Date.now()}`;
    await kv.set(checklistId, {
      ...checklist,
      userId: userId,
      createdAt: new Date().toISOString(),
    });

    return c.json({ success: true, id: checklistId });
  } catch (error) {
    console.error("Create checklist error:", error);
    return c.json({ error: "Erreur lors de la création de la checklist" }, 500);
  }
});

// Récupérer toutes les checklists
app.get("/make-server-f44f03da/checklists", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    
    if (!accessToken) {
      return c.json({ error: "Non autorisé" }, 401);
    }

    const { userId, error } = await authenticateUser(accessToken);
    if (error || !userId) {
      return c.json({ error: "Non autorisé" }, 401);
    }

    const checklists = await kv.getByPrefix("checklist_");
    return c.json({ checklists });
  } catch (error) {
    console.error("Get checklists error:", error);
    return c.json({ error: "Erreur lors de la récupération des checklists" }, 500);
  }
});

// ============= USERS =============

// Récupérer tous les utilisateurs (admin only)
app.get("/make-server-f44f03da/users", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    
    if (!accessToken) {
      return c.json({ error: "Non autorisé" }, 401);
    }

    const supabase = getSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: "Non autorisé" }, 401);
    }

    // Vérifier que l'utilisateur est admin
    if (user.user_metadata?.role !== "admin") {
      return c.json({ error: "Accès refusé" }, 403);
    }

    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error("List users error:", error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({ users: data.users });
  } catch (error) {
    console.error("Get users error:", error);
    return c.json({ error: "Erreur lors de la récupération des utilisateurs" }, 500);
  }
});

// Mettre à jour un utilisateur (admin only)
app.put("/make-server-f44f03da/users/:id", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    
    if (!accessToken) {
      return c.json({ error: "Non autorisé" }, 401);
    }

    const supabase = getSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: "Non autorisé" }, 401);
    }

    // Vérifier que l'utilisateur est admin
    if (user.user_metadata?.role !== "admin") {
      return c.json({ error: "Accès refusé" }, 403);
    }

    const userId = c.req.param("id");
    const updates = await c.req.json();

    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: updates,
    });

    if (error) {
      console.error("Update user error:", error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({ success: true, user: data.user });
  } catch (error) {
    console.error("Update user error:", error);
    return c.json({ error: "Erreur lors de la mise à jour de l'utilisateur" }, 500);
  }
});

// Route de test
app.get("/make-server-f44f03da/health", (c) => {
  return c.json({ status: "OK", message: "Bénin Petro API is running" });
});

Deno.serve(app.fetch);