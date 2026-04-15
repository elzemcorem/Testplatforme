import { UserRole } from "../types";

/**
 * Détermine le rôle de l'utilisateur basé sur son email
 * - Admin : chiffre à la fin du username (ex: daf1@gmail.com)
 * - Contrôleur : chiffre ailleurs dans l'email (ex: da1f@gmail.com)
 * - Utilisateur : pas de chiffre dans l'email
 */
export function determineUserRole(email: string): UserRole {
  // Extraire la partie avant le @
  const username = email.split("@")[0];
  
  if (!username) return "user";
  
  // Vérifier si le dernier caractère est un chiffre
  const lastChar = username[username.length - 1];
  if (/\d/.test(lastChar)) {
    console.log(`🔍 Role detection for ${email}: Admin (username: ${username}, last char: ${lastChar})`);
    return "admin";
  }
  
  // Vérifier si il y a un chiffre ailleurs dans le username
  const hasDigitElsewhere = /\d/.test(username.slice(0, -1));
  if (hasDigitElsewhere) {
    console.log(`🔍 Role detection for ${email}: Controller (username: ${username}, digit in middle)`);
    return "controller";
  }
  
  // Pas de chiffre = utilisateur normal
  console.log(`🔍 Role detection for ${email}: User (username: ${username}, no digit)`);
  return "user";
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