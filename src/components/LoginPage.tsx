import { useEffect, useState, type FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Car, AlertCircle, CheckCircle2, Database } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { themeService } from "../services/themeService";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { login } = useAuth();

  // Initialiser le thème au chargement
  useEffect(() => {
    themeService.initializeTheme();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
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

    if (success) {
      setSuccessMessage("Connexion réussie ! Redirection...");
      return;
    }

    setError("Accès refusé. Veuillez vérifier que votre email est autorisé dans le système. Contactez un administrateur si vous pensez que c'est une erreur.");
    setPassword("");
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: `
          radial-gradient(circle at 20% 50%, rgba(37, 99, 235, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
          linear-gradient(135deg, rgba(241, 245, 249, 0.5) 0%, rgba(226, 232, 240, 0.5) 100%)
        `,
      }}
    >
      {/* Élément décoratif de station pétrolière moderne */}
      <div 
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{
          backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800"><defs><linearGradient id="skyGrad" x1="0%25" y1="0%25" x2="0%25" y2="100%25"><stop offset="0%25" style="stop-color:%232563eb;stop-opacity:0.08"/><stop offset="100%25" style="stop-color:%23ffffff;stop-opacity:0.02"/></linearGradient><filter id="softBlur"><feGaussianBlur stdDeviation="1.5"/></filter></defs><rect width="1200" height="800" fill="url(%23skyGrad)"/><line x1="0" y1="500" x2="1200" y2="500" stroke="%236b7280" stroke-width="2" opacity="0.15"/><g filter="url(%23softBlur)"><rect x="150" y="250" width="50" height="350" fill="%234b5563" rx="3"/><rect x="230" y="200" width="50" height="400" fill="%234b5563" rx="3"/><rect x="310" y="280" width="50" height="320" fill="%234b5563" rx="3"/><circle cx="175" cy="180" r="70" fill="%235a6b7d" opacity="0.7"/><circle cx="255" cy="150" r="65" fill="%235a6b7d" opacity="0.7"/><circle cx="335" cy="190" r="70" fill="%235a6b7d" opacity="0.7"/><rect x="600" y="300" width="80" height="250" fill="%234b5563" rx="4"/><rect x="700" y="280" width="80" height="270" fill="%234b5563" rx="4"/><rect x="800" y="320" width="80" height="230" fill="%234b5563" rx="4"/><circle cx="640" cy="220" r="60" fill="%235a6b7d" opacity="0.6"/><circle cx="740" cy="200" r="65" fill="%235a6b7d" opacity="0.6"/><circle cx="840" cy="240" r="60" fill="%235a6b7d" opacity="0.6"/><rect x="450" y="480" width="120" height="40" fill="%236b7280" rx="2"/><rect x="600" y="480" width="120" height="40" fill="%236b7280" rx="2"/><rect x="750" y="480" width="120" height="40" fill="%236b7280" rx="2"/><path d="M 100 550 Q 300 520 500 550 L 500 800 L 100 800 Z" fill="%236b7280" opacity="0.08"/><path d="M 700 560 Q 900 530 1100 560 L 1100 800 L 700 800 Z" fill="%236b7280" opacity="0.08"/></g></svg>')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          filter: 'blur(1px)',
        }}
      />

      {/* Overlay transparent élégant */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 pointer-events-none" />

      {/* Contenu de connexion */}
      <div className="w-full max-w-md relative z-10">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-full mb-4 shadow-lg">
            <Car className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Bénin Petro</h1>
          <p className="text-muted-foreground">Plateforme de réservation de véhicules</p>
          <Badge variant="outline" className="mt-3 bg-primary/10 border-primary/30">
          <Database className="w-3 h-3 mr-1" />
            Alimenté par Supabase
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

          </CardContent>
        </Card>
      </div>
    </div>
  );
}