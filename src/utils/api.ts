import { projectId, publicAnonKey } from './supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-f44f03da`;

// Récupérer le token d'accès depuis le localStorage
const getAccessToken = () => {
  const session = localStorage.getItem('supabase_session');
  console.log('📦 Checking localStorage for session...');
  if (session) {
    try {
      const parsed = JSON.parse(session);
      const token = parsed.access_token;
      console.log('✅ Session found! Token type:', token?.startsWith('demo_token_') ? 'DEMO' : 'SUPABASE');
      console.log('✅ Token prefix:', token?.substring(0, 20) + '...');
      return token;
    } catch (e) {
      console.error('❌ Error parsing session:', e);
      return null;
    }
  }
  console.warn('⚠️ No session found in localStorage - user might not be logged in');
  return null;
};

// Fonction générique pour les appels API
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken();
  
  console.log('API Call to:', endpoint);
  console.log('Token being sent:', token ? token.substring(0, 30) + '...' : '❌ NO TOKEN');
  
  if (!token) {
    console.error('❌ Cannot make API call - no authentication token available');
    throw new Error('User not authenticated');
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  console.log('Response status:', response.status);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erreur réseau' }));
    console.error('API Error:', error);
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// ============= AUTH =============

export const authAPI = {
  signup: async (email: string, password: string, name: string, role: string) => {
    return apiCall('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, role }),
    });
  },

  signin: async (email: string, password: string) => {
    const response = await apiCall<{ user: any; session: any }>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    // Sauvegarder la session
    if (response.session) {
      localStorage.setItem('supabase_session', JSON.stringify(response.session));
    }
    
    return response;
  },

  getUser: async () => {
    return apiCall('/auth/user');
  },

  signout: () => {
    localStorage.removeItem('supabase_session');
  },
};

// ============= RESERVATIONS =============

export const reservationsAPI = {
  create: async (reservation: any) => {
    return apiCall('/reservations', {
      method: 'POST',
      body: JSON.stringify(reservation),
    });
  },

  getAll: async () => {
    return apiCall<{ reservations: any[] }>('/reservations');
  },

  update: async (id: string, updates: any) => {
    return apiCall(`/reservations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
};

// ============= MESSAGES =============

export const messagesAPI = {
  send: async (message: any) => {
    return apiCall('/messages', {
      method: 'POST',
      body: JSON.stringify(message),
    });
  },

  getAll: async () => {
    return apiCall<{ messages: any[] }>('/messages');
  },
};

// ============= CHECKLISTS =============

export const checklistsAPI = {
  create: async (checklist: any) => {
    return apiCall('/checklists', {
      method: 'POST',
      body: JSON.stringify(checklist),
    });
  },

  getAll: async () => {
    return apiCall<{ checklists: any[] }>('/checklists');
  },
};

// ============= USERS =============

export const usersAPI = {
  getAll: async () => {
    return apiCall<{ users: any[] }>('/users');
  },

  update: async (id: string, updates: any) => {
    return apiCall(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
};