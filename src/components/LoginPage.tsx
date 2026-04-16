import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Car, AlertCircle, CheckCircle2, Database, Trash2, RefreshCw } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { projectId, publicAnonKey } from "../utils/supabase/info";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    const success = await login(email, password);
    setIsLoading(false);

    if (!success) {
      setError("Accès refusé. Veuillez vérifier que votre email est autorisé dans le système. Contactez un administrateur si vous pensez que c'est une erreur.");
      setPassword("");
    } else {
      setSuccessMessage("Connexion réussie ! Redirection...");
    }
  };

  const handleResetAllAccounts = async () => {
    const confirmReset = confirm(
      "⚠️ ATTENTION : Ceci supprimera TOUS les comptes de test de la base de données.\n\n" +
      "Vous pourrez ensuite créer de nouveaux comptes avec n'importe quel email.\n\n" +
      "Voulez-vous continuer ?"
    );

    if (!confirmReset) return;

    setIsResetting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f44f03da/auth/reset-all`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erreur lors de la réinitialisation");
        setIsResetting(false);
        return;
      }

      setSuccessMessage(`✅ ${data.deletedCount} compte(s) supprimé(s) ! Vous pouvez maintenant créer un nouveau compte.`);
      setEmail("");
      setPassword("");
      
      // Nettoyer le localStorage
      localStorage.removeItem('supabase_session');
      localStorage.removeItem('all_accounts');
      
    } catch (error) {
      console.error("Reset error:", error);
      setError("Erreur lors de la réinitialisation");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-full mb-4 shadow-lg">
            <Car className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Bénin Petro</h1>
          <p className="text-muted-foreground">Plateforme de réservation de véhicules</p>
          <Badge variant="outline" className="mt-3 bg-primary/10 border-primary/30">
            <Database className="w-3 h-3 mr-1" />
            Powered by Supabase
          </Badge>
        </div>

        {/* Formulaire de connexion */}
        <Card className="border-2 border-primary/20 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Connexion</CardTitle>
            <CardDescription>
              Connectez-vous pour accéder à votre espace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {successMessage && (
                <Alert className="border-primary bg-primary/10">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-primary">{successMessage}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Adresse email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="exemple@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  disabled={isLoading}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? "Connexion en cours..." : "Se connecter"}
              </Button>
            </form>

            {/* Aide pour les tests */}
            <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg text-xs space-y-2">
              <p className="font-semibold text-primary">✨ Authentification Supabase</p>
              <p className="text-muted-foreground">
                <strong>Première connexion ?</strong> Choisissez n'importe quel email et mot de passe (6+ caractères). 
                Le compte sera créé automatiquement.
              </p>
              <p className="text-muted-foreground">
                <strong>Déjà inscrit ?</strong> Utilisez le même mot de passe que lors de votre première connexion.
              </p>
              
              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded">
                <p className="font-semibold text-amber-800 dark:text-amber-200 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Erreur "Invalid credentials" ?
                </p>
                <p className="text-amber-700 dark:text-amber-300 mt-1">
                  Cela signifie que le compte existe déjà mais avec un autre mot de passe. 
                  Utilisez un <strong>nouvel email</strong> pour créer un nouveau compte.
                </p>
              </div>

              <div className="mt-3">
                <p className="font-semibold">Exemples d'emails pour tester :</p>
                <ul className="space-y-1 text-muted-foreground mt-1">
                  <li>• <strong>Admin</strong> : test1@beninpetro.com (chiffre à la fin)</li>
                  <li>• <strong>Contrôleur</strong> : test2ctrl@beninpetro.com (chiffre au milieu)</li>
                  <li>• <strong>Utilisateur</strong> : testuser@beninpetro.com (sans chiffre)</li>
                </ul>
                <p className="text-muted-foreground mt-2 italic">
                  Mot de passe suggéré : <code className="bg-muted px-1 rounded">test123456</code>
                </p>
              </div>
            </div>

            {/* Bouton de réinitialisation */}
            <div className="mt-4 pt-4 border-t border-primary/20">
              <p className="text-xs text-muted-foreground text-center mb-2">
                Bloqué avec un mauvais mot de passe ?
              </p>
              <Button
                type="button"
                variant="destructive"
                className="w-full"
                onClick={handleResetAllAccounts}
                disabled={isResetting}
              >
                {isResetting ? (
                  <>
                    <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                    Réinitialisation en cours...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Nouveau Départ (Supprimer Tous les Comptes)
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2 italic">
                Supprime tous les comptes pour repartir à zéro
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}