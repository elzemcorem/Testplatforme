import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { getInitials, getNameFromEmail } from '../utils/auth';
import { supabase, authApi, profilesApi, Profile } from '../lib/supabase';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Convertit un profil Supabase en objet User local */
function mapProfile(profile: Profile): User {
  return {
    id:        profile.id,
    email:     profile.email,
    name:      profile.name,
    role:      profile.role,          // ✅ rôle lu depuis la DB, pas depuis l'email
    initials:  getInitials(profile.name),
    status:    profile.status,
    isOnline:  profile.is_online,
    lastSeen:  profile.last_seen ? new Date(profile.last_seen) : new Date(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading]     = useState(true);

  // ── Marquer hors ligne à la fermeture de l'onglet ────────────────────
  useEffect(() => {
    const handleUnload = () => {
      if (currentUser) {
        // navigator.sendBeacon est non-bloquant et survivra à la fermeture
        profilesApi.setOnline(currentUser.id, false);
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [currentUser]);

  // ── Écouter les changements de session Supabase Auth ─────────────────
  useEffect(() => {
    const { data: { subscription } } = authApi.onAuthChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: profile, error } = await profilesApi.getById(session.user.id);
        if (error || !profile) {
          // Profil pas encore créé (trigger async) — fallback minimal
          setCurrentUser({
            id:       session.user.id,
            email:    session.user.email || '',
            name:     session.user.user_metadata?.name || getNameFromEmail(session.user.email || ''),
            role:     session.user.user_metadata?.role || 'user',
            initials: getInitials(session.user.user_metadata?.name || ''),
            status:   'active',
            isOnline: true,
            lastSeen: new Date(),
          });
        } else {
          setCurrentUser(mapProfile(profile));
          await profilesApi.setOnline(profile.id, true);
        }
      }

      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
      }

      if (event === 'INITIAL_SESSION') {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { error } = await authApi.signIn(email, password);
      if (error) {
        console.error('Login error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Unexpected login error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // ── Logout ────────────────────────────────────────────────────────────
  const logout = async () => {
    if (currentUser) {
      await profilesApi.setOnline(currentUser.id, false);
    }
    await authApi.signOut();
    // setCurrentUser(null) sera déclenché par onAuthChange(SIGNED_OUT)
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
