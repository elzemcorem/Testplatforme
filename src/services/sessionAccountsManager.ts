/**
 * Session Accounts Manager
 * Gère les comptes de session (temporaires) 
 * Permet aux utilisateurs d'ajouter/supprimer des comptes pour la session actuelle
 */

export interface SessionAccount {
  id: string;
  email: string;
  name: string;
  role: string;
  initials: string;
  addedAt: number; // timestamp
  isSaved?: boolean; // persisted across sessions
}

const SESSION_ACCOUNTS_KEY = 'app_session_accounts';
const SAVED_ACCOUNTS_KEY = 'app_saved_accounts';

export class SessionAccountsManager {
  /**
   * Récupérer tous les comptes de session (temporaires + sauvegardés)
   */
  static getSessionAccounts(): SessionAccount[] {
    try {
      // Charger les comptes temporaires
      const sessionStr = sessionStorage.getItem(SESSION_ACCOUNTS_KEY);
      const sessionAccounts = sessionStr ? JSON.parse(sessionStr) : [];
      
      // Charger les comptes sauvegardés
      const savedStr = localStorage.getItem(SAVED_ACCOUNTS_KEY);
      const savedAccounts = savedStr ? JSON.parse(savedStr) : [];
      
      // Combiner et dédupliquer par email
      const combined = [...sessionAccounts, ...savedAccounts];
      const uniqueMap = new Map();
      combined.forEach(acc => {
        if (!uniqueMap.has(acc.email)) {
          uniqueMap.set(acc.email, acc);
        }
      });
      
      return Array.from(uniqueMap.values());
    } catch (error) {
      console.error('Error loading session accounts:', error);
      return [];
    }
  }

  /**
   * Ajouter un compte à la session actuelle
   */
  static addSessionAccount(account: Omit<SessionAccount, 'addedAt'>): void {
    try {
      const accounts = this.getSessionAccounts();
      
      // Vérifier si le compte existe déjà
      if (accounts.find(a => a.email === account.email)) {
        console.log('Account already exists:', account.email);
        return;
      }

      // Ajouter aux comptes de session
      const newAccount: SessionAccount = {
        ...account,
        addedAt: Date.now(),
        isSaved: false
      };
      
      const sessionStr = sessionStorage.getItem(SESSION_ACCOUNTS_KEY) || '[]';
      const sessionAccounts = JSON.parse(sessionStr);
      sessionAccounts.push(newAccount);
      sessionStorage.setItem(SESSION_ACCOUNTS_KEY, JSON.stringify(sessionAccounts));
      
      console.log('Session account added:', account.email);
    } catch (error) {
      console.error('Error adding session account:', error);
    }
  }

  /**
   * Supprimer un compte de la session
   */
  static removeSessionAccount(email: string): void {
    try {
      const sessionStr = sessionStorage.getItem(SESSION_ACCOUNTS_KEY) || '[]';
      let sessionAccounts = JSON.parse(sessionStr);
      sessionAccounts = sessionAccounts.filter((a: SessionAccount) => a.email !== email);
      sessionStorage.setItem(SESSION_ACCOUNTS_KEY, JSON.stringify(sessionAccounts));
      
      console.log('Session account removed:', email);
    } catch (error) {
      console.error('Error removing session account:', error);
    }
  }

  /**
   * Sauvegarder un compte pour les prochaines sessions
   */
  static saveAccount(account: SessionAccount): void {
    try {
      const savedStr = localStorage.getItem(SAVED_ACCOUNTS_KEY) || '[]';
      const savedAccounts = JSON.parse(savedStr);
      
      // Vérifier si le compte est déjà sauvegardé
      if (savedAccounts.find((a: SessionAccount) => a.email === account.email)) {
        console.log('Account already saved:', account.email);
        return;
      }

      const accountToSave: SessionAccount = {
        ...account,
        isSaved: true,
        addedAt: Date.now()
      };
      
      savedAccounts.push(accountToSave);
      localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(savedAccounts));
      
      console.log('Account saved for future sessions:', account.email);
    } catch (error) {
      console.error('Error saving account:', error);
    }
  }

  /**
   * Supprimer un compte des comptes sauvegardés
   */
  static unsaveAccount(email: string): void {
    try {
      const savedStr = localStorage.getItem(SAVED_ACCOUNTS_KEY) || '[]';
      let savedAccounts = JSON.parse(savedStr);
      savedAccounts = savedAccounts.filter((a: SessionAccount) => a.email !== email);
      localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(savedAccounts));
      
      console.log('Account unsaved:', email);
    } catch (error) {
      console.error('Error unsaving account:', error);
    }
  }

  /**
   * Nettoyer les comptes de session (appelé au logout)
   */
  static clearSessionAccounts(): void {
    try {
      sessionStorage.removeItem(SESSION_ACCOUNTS_KEY);
      console.log('Session accounts cleared');
    } catch (error) {
      console.error('Error clearing session accounts:', error);
    }
  }

  /**
   * Récupérer les comptes sauvegardés uniquement
   */
  static getSavedAccounts(): SessionAccount[] {
    try {
      const savedStr = localStorage.getItem(SAVED_ACCOUNTS_KEY) || '[]';
      return JSON.parse(savedStr);
    } catch (error) {
      console.error('Error loading saved accounts:', error);
      return [];
    }
  }

  /**
   * Récupérer les comptes temporaires uniquement
   */
  static getTemporaryAccounts(): SessionAccount[] {
    try {
      const sessionStr = sessionStorage.getItem(SESSION_ACCOUNTS_KEY) || '[]';
      return JSON.parse(sessionStr);
    } catch (error) {
      console.error('Error loading temporary accounts:', error);
      return [];
    }
  }
}
