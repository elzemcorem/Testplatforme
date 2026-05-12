import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

// Client Supabase pour le frontend
export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

// Helper pour obtenir le token d'accès actuel
export const getAccessToken = (): string | null => {
  try {
    const session = localStorage.getItem('supabase_session');
    if (session) {
      const parsed = JSON.parse(session);
      return parsed.access_token || null;
    }
    return null;
  } catch {
    return null;
  }
};

// Helper pour faire des requêtes API authentifiées
export const makeAuthenticatedRequest = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getAccessToken();
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  });
};
