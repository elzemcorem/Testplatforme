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
  const [allAccounts, setAllAccounts] = useState<User[]>([]);

  // Charger tous les utilisateurs autorisés depuis Supabase
  const loadAllUsers = async () => {
    try {
      console.log('🔄 Chargement des utilisateurs depuis Supabase...');
      
      const { data, error } = await supabase
        .from('allowed_users')
        .select('id, noms, email, role')
        .order('noms', { ascending: true });

      if (error) {
        console.error('❌ Erreur lors du chargement des utilisateurs:', error);
        return;
      }

      const users = (data || []).map((row: any) => ({
        id: row.email || '', // Utiliser l'email comme ID pour les conversations
        email: row.email || '',
        name: row.noms || getNameFromEmail(row.email || ''),
        role: row.role || 'user',
        initials: getInitials(row.noms || ''),
        status: 'active',
        isOnline: true,
        lastSeen: new Date(),
      }));

      setAllAccounts(users);
      console.log(`✅ ${users.length} utilisateurs chargés depuis Supabase`);
    } catch (error) {
      console.error('❌ Exception lors du chargement des utilisateurs:', error);
    }
  };

  // Charger tous les utilisateurs quand l'app démarre ou quand l'utilisateur se connecte
  useEffect(() => {
    loadAllUsers();
  }, [currentUser]);

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
        // Charger tous les utilisateurs depuis Supabase
        await loadAllUsers();
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
      
      console.log('✅ User is authorized, attempting login with Supabase Auth...');
      
      // Utiliser signInWithPassword de Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (error) {
        console.error('❌ Login failed:', error.message);
        
        // Si le compte n'existe pas, créer le compte UNE SEULE FOIS
        if (error.message.includes('Email not confirmed') || 
            error.message.includes('Invalid login credentials') ||
            error.message.includes('User not found')) {
          
          // Vérifier que on n'a pas déjà essayé de créer ce compte
          const creationAttempted = sessionStorage.getItem(`signup_attempt_${email}`);
          
          if (creationAttempted) {
            console.error('❌ Signup already attempted for this email recently');
            console.error('💡 Please wait a few minutes or try with a different password');
            setIsLoading(false);
            return false;
          }
          
          console.log('📝 Account not found. Creating account automatically...');
          
          // Marquer que nous avons tenté la création
          sessionStorage.setItem(`signup_attempt_${email}`, 'true');
          
          const role = await determineUserRole(email);
          const name = allowedUser.name || getNameFromEmail(email);
          
          // Créer le compte - UNE SEULE TENTATIVE
          const { data: signupData, error: signupError } = await supabase.auth.signUp({
            email: email.trim().toLowerCase(),
            password: password,
            options: {
              data: {
                name: name,
                role: role,
                initials: getInitials(name),
              }
            }
          });
          
          if (signupError) {
            console.error('❌ Auto-signup failed:', signupError.message);
            
            if (signupError.message.includes('rate limit')) {
              console.error('💡 Too many signup attempts. Please wait 15-30 minutes before trying again');
            }
            
            setIsLoading(false);
            return false;
          }
          
          if (signupData.user) {
            console.log('✅ Account created automatically!');
            
            // Attendre 1 seconde pour que la BD se mette à jour
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Maintenant se connecter
            const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
              email: email.trim().toLowerCase(),
              password: password,
            });
            
            if (loginError) {
              console.error('❌ Auto-login failed:', loginError.message);
              setIsLoading(false);
              return false;
            }
            
            if (loginData.session && loginData.user) {
              console.log('✅ Login successful after auto-signup!');
              
              const role = await determineUserRole(loginData.user.email || email);
              const user: User = {
                id: loginData.user.id,
                email: loginData.user.email || email,
                name: loginData.user.user_metadata?.name || allowedUser.name || getNameFromEmail(loginData.user.email || email),
                role: role,
                initials: loginData.user.user_metadata?.initials || getInitials(loginData.user.user_metadata?.name || allowedUser.name || ''),
                status: loginData.user.user_metadata?.status || 'active',
                isOnline: true,
                lastSeen: new Date(),
              };

              setCurrentUser(user);
              updateLocalAccounts(user);

              localStorage.setItem('supabase_session', JSON.stringify({
                access_token: loginData.session.access_token,
                user: user
              }));

              setIsLoading(false);
              return true;
            }
          }
          
          setIsLoading(false);
          return false;
        }
        
        setIsLoading(false);
        return false;
      }

      if (data.session && data.user) {
        console.log('✅ Login successful!');
        
        // Récupérer le rôle depuis allowed_users
        const role = await determineUserRole(data.user.email || email);

        // Créer l'objet User
        const user: User = {
          id: data.user.id,
          email: data.user.email || email,
          name: data.user.user_metadata?.name || allowedUser.name || getNameFromEmail(data.user.email || email),
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

      // Utiliser signUpWithPassword de Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
          data: {
            name: name,
            role: role,
            initials: getInitials(name),
          }
        }
      });

      if (error) {
        console.error('❌ Signup failed:', error.message);
        
        if (error.message.includes('already registered')) {
          console.error('❌ Account already exists');
          console.error('💡 Try logging in instead, or use "Nouveau Départ" to reset');
        }
        
        return false;
      }

      if (data.user) {
        console.log('✅ Account created successfully!');
        
        // Se connecter automatiquement après l'inscription
        return await login(email, password);
      }

      return false;
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
    const email = userId; // userId is actually the email
    
    try {
      // Demander le mot de passe pour le compte cible
      const password = window.prompt(`Entrez votre mot de passe pour vous connecter à ${email}:`);
      
      if (!password) {
        console.log('❌ Account switch cancelled - no password provided');
        return;
      }
      
      // Se déconnecter du compte actuel
      console.log(`👋 Logging out from ${currentUser?.email}...`);
      await logout();
      
      // Attendre que la déconnexion se propage
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Se connecter au nouveau compte
      console.log(`🔐 Logging in to ${email}...`);
      const success = await login(email, password);
      
      if (success) {
        console.log(`✅ Successfully switched to ${email}`);
      } else {
        console.error(`❌ Failed to switch to ${email}`);
        alert('❌ Impossible de se connecter à ce compte. Vérifiez vos identifiants.');
      }
      
    } catch (error) {
      console.error('❌ Error during account switch:', error);
      alert('❌ Erreur lors du changement de compte');
    }
  };

  const getAllAccounts = (): User[] => {
    return allAccounts;
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