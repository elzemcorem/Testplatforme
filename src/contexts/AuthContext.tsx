import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "../types";
import { determineUserRole, getInitials, getNameFromEmail, checkAllowedUser } from "../utils/auth";
import { supabase } from "../utils/supabase/client";
import { projectId, publicAnonKey } from "../utils/supabase/info";

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchAccount: (userId: string) => void;
  getAllAccounts: () => User[];
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Charger l'utilisateur depuis la session Supabase au démarrage
  useEffect(() => {
    const loadUser = async () => {
      try {
        console.log('🔄 Loading user session from Supabase...');
        
        // Vérifier s'il y a une session Supabase active
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error loading session:", error);
          localStorage.removeItem('supabase_session');
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          console.log('✅ Active session found for:', session.user.email);
          
          // Vérifier que l'utilisateur est dans la table allowed_users
          const allowedUser = await checkAllowedUser(session.user.email || '');
          
          if (!allowedUser?.allowed) {
            console.error('❌ User not in allowed_users table');
            localStorage.removeItem('supabase_session');
            await supabase.auth.signOut();
            setIsLoading(false);
            return;
          }
          
          // Récupérer le rôle depuis la table allowed_users
          const role = await determineUserRole(session.user.email || '');
          
          // Créer l'objet User à partir des métadonnées Supabase
          const user: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || allowedUser.name || getNameFromEmail(session.user.email || ''),
            role: role,
            initials: session.user.user_metadata?.initials || getInitials(session.user.user_metadata?.name || allowedUser.name || ''),
            status: session.user.user_metadata?.status || 'active',
            isOnline: true,
            lastSeen: new Date(),
          };

          setCurrentUser(user);
          updateLocalAccounts(user);

          // Sauvegarder la session dans localStorage pour référence
          localStorage.setItem('supabase_session', JSON.stringify({
            access_token: session.access_token,
            user: user
          }));

          console.log('✅ User loaded from Supabase session:', user.email);
        } else {
          console.log('ℹ️ No active session found');
        }
      } catch (error) {
        console.error("Error loading user:", error);
        localStorage.removeItem('supabase_session');
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Mettre à jour la liste des comptes dans localStorage
  const updateLocalAccounts = (user: User) => {
    const accounts = JSON.parse(localStorage.getItem('all_accounts') || '[]');
    const existingIndex = accounts.findIndex((acc: User) => acc.id === user.id);
    
    if (existingIndex >= 0) {
      accounts[existingIndex] = user;
    } else {
      accounts.push(user);
    }
    
    localStorage.setItem('all_accounts', JSON.stringify(accounts));
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      console.log('🔐 Verifying email in allowed_users table:', email);
      
      // Vérifier si l'utilisateur est dans la table allowed_users
      const allowedUser = await checkAllowedUser(email);
      
      if (!allowedUser?.allowed) {
        console.error('❌ Email not authorized. User not found in allowed_users table');
        setIsLoading(false);
        return false;
      }
      
      console.log('✅ User is authorized, attempting login...');
      
      // Appeler l'endpoint de signin sur le serveur
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f44f03da/auth/signin`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (!response.ok || data.error) {
        console.error('❌ Login failed:', data.error);
        
        // Analyser le type d'erreur pour décider de l'action
        const errorMessage = data.error || '';
        
        // Si le serveur indique que l'utilisateur existe avec un mauvais mot de passe
        if (data.userExists) {
          console.error('❌ Wrong password for existing account');
          console.error('💡 Solution: Use a different email or click "Nouveau Départ"');
          return false;
        }
        
        // Si l'utilisateur n'existe pas, refuser (ne pas créer automatiquement)
        if (errorMessage.includes('Email not confirmed') || 
            errorMessage.includes('User not found') ||
            errorMessage.includes('not registered')) {
          console.error('❌ Account not found. Please contact an administrator to be added to allowed_users');
          return false;
        }
        
        // Si c'est une erreur de credentials invalides (mauvais mot de passe pour compte existant)
        if (errorMessage.includes('Invalid login credentials')) {
          console.error('❌ Wrong password for existing account');
          console.error('💡 Solution: Use a different email or click "Nouveau Départ"');
          return false;
        }
        
        // Si le compte existe déjà (erreur de signup)
        if (errorMessage.includes('already been registered')) {
          console.error('❌ Account exists - please use the correct password');
          return false;
        }
        
        return false;
      }

      if (data.session && data.user) {
        // Log si le compte a été créé automatiquement
        if (data.accountCreated) {
          console.log('🎉 Account created automatically!');
        }
        console.log('✅ Login successful!');
        
        // Définir la session dans Supabase client
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });

        // Récupérer le rôle depuis allowed_users
        const role = await determineUserRole(data.user.email);

        // Créer l'objet User
        const user: User = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || allowedUser.name || getNameFromEmail(data.user.email),
          role: role,
          initials: data.user.user_metadata?.initials || getInitials(data.user.user_metadata?.name || allowedUser.name || ''),
          status: data.user.user_metadata?.status || 'active',
          isOnline: true,
          lastSeen: new Date(),
        };

        setCurrentUser(user);
        updateLocalAccounts(user);

        // Sauvegarder la session
        localStorage.setItem('supabase_session', JSON.stringify({
          access_token: data.session.access_token,
          user: user
        }));

        return true;
      }

      return false;
    } catch (error: any) {
      console.error("❌ Login error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction signup pour créer automatiquement un compte
  const signup = async (email: string, password: string): Promise<boolean> => {
    try {
      // Vérifier d'abord si l'utilisateur est autorisé
      const allowedUser = await checkAllowedUser(email);
      
      if (!allowedUser?.allowed) {
        console.error('❌ Signup rejected: Email not in allowed_users table');
        console.error('💡 Only authorized emails from the allowed_users table can create an account');
        return false;
      }
      
      const role = await determineUserRole(email);
      const name = allowedUser.name || getNameFromEmail(email);

      console.log('📝 Creating account for:', email, 'with role:', role);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f44f03da/auth/signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ email, password, name, role }),
        }
      );

      const data = await response.json();

      if (!response.ok || data.error) {
        console.error('❌ Signup failed:', data.error);
        return false;
      }

      console.log('✅ Account created successfully! Now logging in...');
      
      // Se connecter automatiquement après l'inscription
      return await login(email, password);
    } catch (error) {
      console.error("❌ Signup error:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      console.log('👋 Logging out...');
      
      // Déconnecter de Supabase
      await supabase.auth.signOut();
      
      // Nettoyer le localStorage
      localStorage.removeItem('supabase_session');
      
      setCurrentUser(null);
      
      console.log('✅ Logged out successfully');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const switchAccount = async (userId: string) => {
    const accounts = JSON.parse(localStorage.getItem('all_accounts') || '[]');
    const user = accounts.find((acc: User) => acc.id === userId);
    
    if (user) {
      // Pour changer de compte, on doit se déconnecter et se reconnecter
      // Ceci est une limitation - pour un vrai switch, il faudrait stocker
      // les credentials de chaque compte, ce qui n'est pas sécurisé
      console.log('⚠️ Account switching requires re-login with that account credentials');
      
      setCurrentUser(user);
      
      // Mettre à jour la session locale (mais ce ne sera pas une vraie session Supabase)
      localStorage.setItem('supabase_session', JSON.stringify({
        access_token: null,
        user: user
      }));
    }
  };

  const getAllAccounts = (): User[] => {
    return JSON.parse(localStorage.getItem('all_accounts') || '[]');
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, switchAccount, getAllAccounts, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}