import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { AlertCircle, Check } from 'lucide-react';
import { toast } from 'sonner';
import { SessionAccountsManager, type SessionAccount } from '../services/sessionAccountsManager';
import { getInitials, checkAllowedUser, determineUserRole } from '../utils/auth';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountAdded?: () => void;
}

export function AddAccountModal({ isOpen, onClose, onAccountAdded }: AddAccountModalProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddAccount = async () => {
    if (!email.trim()) {
      setError('Veuillez entrer une adresse email');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Vérifier que l'email est autorisé
      const allowedUser = await checkAllowedUser(email.trim().toLowerCase());

      if (!allowedUser?.allowed) {
        setError('❌ Cet email n\'est pas autorisé. Vérifiez que vous êtes dans la liste des utilisateurs autorisés.');
        setIsLoading(false);
        return;
      }

      // Obtenir le rôle
      const role = await determineUserRole(email.trim().toLowerCase());

      // Créer l'objet de compte
      const newAccount: Omit<SessionAccount, 'addedAt'> = {
        id: allowedUser.id?.toString() || email,
        email: email.trim().toLowerCase(),
        name: allowedUser.name || email,
        role,
        initials: getInitials(allowedUser.name || email),
      };

      // Ajouter à la session
      SessionAccountsManager.addSessionAccount(newAccount);

      toast.success(`✅ Compte ${email} ajouté à la session!`);
      setEmail('');
      onAccountAdded?.();
      onClose();
    } catch (err) {
      console.error('Error adding account:', err);
      setError('❌ Erreur lors de l\'ajout du compte. Vérifiez votre connexion.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ajouter un compte à la session</DialogTitle>
          <DialogDescription>
            Ajoutez un email autorisé pour le changer rapidement pendant cette session.
            Les comptes temporaires seront supprimés quand vous fermerez votre session.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              💡 Les comptes temporaires disparaissent quand vous vous déconnectez.
              Vous pouvez sauvegarder un compte pour vos prochaines connexions.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="email">Adresse email du compte à ajouter</Label>
            <Input
              id="email"
              type="email"
              placeholder="exemple@beninpetro.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              disabled={isLoading}
            />
          </div>

          {error && (
            <Alert className="border-red-200 bg-red-50 dark:bg-red-950">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 dark:text-red-200">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              ✓ Vous pourrez basculer entre les comptes ajoutés dans le menu profil
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleAddAccount}
            disabled={isLoading || !email.trim()}
          >
            {isLoading ? 'Vérification...' : 'Ajouter le compte'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
