import { UserRole } from "../types";
import { supabase } from "./supabase/client";

/**
 * Vérifie si un utilisateur est autorisé et retourne ses infos de la table allowed_users
 */
export async function checkAllowedUser(email: string): Promise<{
  allowed: boolean;
  role?: UserRole;
  name?: string;
  id?: number;
} | null> {
  try {
    console.log(`🔍 Checking if ${email} is in allowed_users table...`);
    
    const { data, error } = await supabase
      .from('allowed_users')
      .select('id, noms, email, role')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Pas d'utilisateur trouvé
        console.log(`❌ User ${email} is NOT in allowed_users table`);
        return { allowed: false };
      }
      console.error('Error checking allowed_users:', error);
      return null;
    }

    if (data) {
      const role = (data.role?.toLowerCase() as UserRole) || 'user';
      console.log(`✅ User ${email} found in allowed_users with role: ${role}`);
      return {
        allowed: true,
        role: role,
        name: data.noms,
        id: data.id
      };
    }

    return { allowed: false };
  } catch (error) {
    console.error('Error in checkAllowedUser:', error);
    return null;
  }
}

/**
 * Détermine le rôle de l'utilisateur basé sur sa ligne dans allowed_users
 * Fallback: basé sur le pattern de l'email si pas dans la table
 */
export async function determineUserRole(email: string): Promise<UserRole> {
  // D'abord vérifier la table allowed_users
  const allowedUser = await checkAllowedUser(email);
  
  if (allowedUser?.allowed && allowedUser?.role) {
    return allowedUser.role;
  }

  // Si pas trouvé dans allowed_users, retourner 'user' par défaut
  // (mais l'authentification devrait échouer avant d'arriver ici)
  console.log(`⚠️ User ${email} not in allowed_users, defaulting to 'user' role`);
  return 'user';
}

/**
 * Génère les initiales à partir d'un nom
 */
export function getInitials(name: string): string {
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * Génère un nom à partir d'un email
 */
export function getNameFromEmail(email: string): string {
  const username = email.split("@")[0];
  // Capitaliser la première lettre
  return username.charAt(0).toUpperCase() + username.slice(1);
}