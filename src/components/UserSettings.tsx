import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Bell, 
  Shield, 
  Palette,
  Save
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner@2.0.3";
import { getInitials } from "../utils/auth";
import { themeService, type ColorScheme, colorSchemes } from "../services/themeService";

interface UserPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  reminderNotifications: boolean;
  reportNotifications: boolean;
  darkMode: boolean;
  compactMode: boolean;
  twoFactor: boolean;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
}

export function UserSettings() {
  const { currentUser } = useAuth();
  const [selectedColorScheme, setSelectedColorScheme] = useState<ColorScheme>('blue');
  
  // État du profil
  const [profile, setProfile] = useState<UserProfile>({
    firstName: "",
    lastName: "",
    email: currentUser?.email || "",
    phone: "",
    address: "",
  });

  // État des préférences
  const [preferences, setPreferences] = useState<UserPreferences>({
    emailNotifications: true,
    smsNotifications: true,
    reminderNotifications: false,
    reportNotifications: true,
    darkMode: false,
    compactMode: false,
    twoFactor: false,
  });

  // État pour le changement de mot de passe
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Charger les données depuis localStorage au démarrage
  useEffect(() => {
    if (currentUser) {
      loadUserProfile();
      loadUserPreferences();
      loadColorScheme();
    }
  }, [currentUser]);

  // Appliquer le mode sombre
  useEffect(() => {
    if (preferences.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [preferences.darkMode]);

  const loadUserProfile = () => {
    const storedProfile = localStorage.getItem(`user_profile_${currentUser?.id}`);
    if (storedProfile) {
      try {
        const parsed = JSON.parse(storedProfile);
        setProfile(parsed);
      } catch (error) {
        console.error("Error loading profile:", error);
      }
    } else {
      // Initialiser avec les données de base
      const nameParts = currentUser?.name.split(" ") || ["", ""];
      setProfile({
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
        email: currentUser?.email || "",
        phone: "",
        address: "",
      });
    }
  };

  const loadUserPreferences = () => {
    const storedPrefs = localStorage.getItem(`user_preferences_${currentUser?.id}`);
    if (storedPrefs) {
      try {
        const parsed = JSON.parse(storedPrefs);
        setPreferences(parsed);
      } catch (error) {
        console.error("Error loading preferences:", error);
      }
    }
  };

  const loadColorScheme = () => {
    const scheme = themeService.getCurrentScheme();
    setSelectedColorScheme(scheme);
  };

  const handleColorSchemeChange = (scheme: ColorScheme) => {
    setSelectedColorScheme(scheme);
    themeService.setColorScheme(scheme);
    toast.success(`Thème changé en ${themeService.getSchemeLabel(scheme)}`);
  };

  const handleSaveProfile = () => {
    if (!currentUser) return;
    
    if (!profile.firstName || !profile.lastName || !profile.email) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      // Sauvegarder le profil
      localStorage.setItem(`user_profile_${currentUser.id}`, JSON.stringify(profile));
      
      // Mettre à jour le nom dans la session et les comptes
      const newName = `${profile.firstName} ${profile.lastName}`;
      const newInitials = getInitials(newName);
      
      const updatedUser = {
        ...currentUser,
        name: newName,
        initials: newInitials,
        email: profile.email,
      };
      
      // Mettre à jour la session
      const session = localStorage.getItem('supabase_session');
      if (session) {
        const parsed = JSON.parse(session);
        parsed.user = updatedUser;
        localStorage.setItem('supabase_session', JSON.stringify(parsed));
      }
      
      // Mettre à jour dans all_accounts
      const accounts = JSON.parse(localStorage.getItem('all_accounts') || '[]');
      const accountIndex = accounts.findIndex((acc: any) => acc.id === currentUser.id);
      if (accountIndex >= 0) {
        accounts[accountIndex] = updatedUser;
        localStorage.setItem('all_accounts', JSON.stringify(accounts));
      }
      
      toast.success("Profil mis à jour avec succès ! Rafraîchissez la page pour voir les changements.");
      
      // Recharger la page après 1 seconde pour appliquer les changements
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Erreur lors de la sauvegarde du profil");
    }
  };

  const handlePreferenceChange = (key: keyof UserPreferences, value: boolean) => {
    if (!currentUser) return;
    
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    
    try {
      localStorage.setItem(`user_preferences_${currentUser.id}`, JSON.stringify(newPreferences));
      toast.success("Préférence mise à jour");
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const handleChangePassword = () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    // Dans un environnement de production, cela ferait un appel API
    // Pour le mode démo, on simule juste le succès
    toast.success("Mot de passe mis à jour avec succès !");
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrateur";
      case "controller":
        return "Contrôleur";
      case "user":
        return "Utilisateur";
      default:
        return role;
    }
  };

  return (
    <div className="p-6 space-y-6 bg-background min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Paramètres & Profil</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos préférences utilisateur et informations de profil
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="border-2 border-primary/20 lg:col-span-1">
          <CardHeader>
            <CardTitle>Photo de profil</CardTitle>
            <CardDescription>Votre identité visuelle</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="w-32 h-32">
                <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-primary/80 text-white">
                  {currentUser?.initials || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h3 className="font-semibold text-lg">{currentUser?.name || "Utilisateur"}</h3>
                <p className="text-sm text-muted-foreground capitalize">
                  {getRoleName(currentUser?.role || "user")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {currentUser?.email}
                </p>
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => toast.info("Fonctionnalité de téléchargement de photo à venir")}
              >
                Changer la photo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="border-2 border-primary/20 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Informations personnelles
            </CardTitle>
            <CardDescription>Mettez à jour vos informations de profil</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  Prénom <span className="text-red-500">*</span>
                </Label>
                <Input 
                  id="firstName" 
                  value={profile.firstName}
                  onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">
                  Nom <span className="text-red-500">*</span>
                </Label>
                <Input 
                  id="lastName" 
                  value={profile.lastName}
                  onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email <span className="text-red-500">*</span>
              </Label>
              <Input 
                id="email" 
                type="email" 
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Téléphone
              </Label>
              <Input 
                id="phone" 
                type="tel" 
                placeholder="+229 97 00 00 00"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Adresse
              </Label>
              <Input 
                id="address" 
                placeholder="Cotonou, Bénin"
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button 
                className="bg-primary hover:bg-primary/90 gap-2"
                onClick={handleSaveProfile}
              >
                <Save className="w-4 h-4" />
                Enregistrer les modifications
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications Settings */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Préférences de notification
          </CardTitle>
          <CardDescription>
            Gérez comment vous souhaitez être notifié
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Notifications par email</Label>
              <p className="text-sm text-muted-foreground">
                Recevoir des emails pour les nouvelles réservations
              </p>
            </div>
            <Switch 
              id="email-notifications" 
              checked={preferences.emailNotifications}
              onCheckedChange={(checked) => handlePreferenceChange("emailNotifications", checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sms-notifications">Notifications SMS</Label>
              <p className="text-sm text-muted-foreground">
                Recevoir des SMS pour les réservations urgentes
              </p>
            </div>
            <Switch 
              id="sms-notifications" 
              checked={preferences.smsNotifications}
              onCheckedChange={(checked) => handlePreferenceChange("smsNotifications", checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="reminder-notifications">Rappels automatiques</Label>
              <p className="text-sm text-muted-foreground">
                Rappels pour les véhicules en maintenance
              </p>
            </div>
            <Switch 
              id="reminder-notifications" 
              checked={preferences.reminderNotifications}
              onCheckedChange={(checked) => handlePreferenceChange("reminderNotifications", checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="report-notifications">Rapports hebdomadaires</Label>
              <p className="text-sm text-muted-foreground">
                Recevoir un résumé hebdomadaire des performances
              </p>
            </div>
            <Switch 
              id="report-notifications" 
              checked={preferences.reportNotifications}
              onCheckedChange={(checked) => handlePreferenceChange("reportNotifications", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Sécurité
          </CardTitle>
          <CardDescription>
            Gérez vos paramètres de sécurité et de confidentialité
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Mot de passe actuel</Label>
            <Input 
              id="current-password" 
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nouveau mot de passe</Label>
              <Input 
                id="new-password" 
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
              <Input 
                id="confirm-password" 
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              />
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="two-factor">Authentification à deux facteurs</Label>
              <p className="text-sm text-muted-foreground">
                Ajouter une couche de sécurité supplémentaire
              </p>
            </div>
            <Switch 
              id="two-factor" 
              checked={preferences.twoFactor}
              onCheckedChange={(checked) => handlePreferenceChange("twoFactor", checked)}
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              className="bg-primary hover:bg-primary/90"
              onClick={handleChangePassword}
            >
              Mettre à jour le mot de passe
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Appearance Settings */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            Apparence
          </CardTitle>
          <CardDescription>
            Personnalisez l'apparence de votre interface
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="dark-mode">Mode sombre</Label>
              <p className="text-sm text-muted-foreground">
                Activer le thème sombre pour l'interface
              </p>
            </div>
            <Switch 
              id="dark-mode" 
              checked={preferences.darkMode}
              onCheckedChange={(checked) => {
                handlePreferenceChange("darkMode", checked);
                if (checked) {
                  toast.success("Mode sombre activé");
                } else {
                  toast.success("Mode sombre désactivé");
                }
              }}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="compact-mode">Mode compact</Label>
              <p className="text-sm text-muted-foreground">
                Réduire l'espacement entre les éléments
              </p>
            </div>
            <Switch 
              id="compact-mode" 
              checked={preferences.compactMode}
              onCheckedChange={(checked) => {
                handlePreferenceChange("compactMode", checked);
                toast.info("Le mode compact sera bientôt disponible");
              }}
            />
          </div>

          <Separator />

          {/* Palettes de couleurs */}
          <div className="space-y-3">
            <Label>Palette de couleurs globale</Label>
            <p className="text-sm text-muted-foreground">
              Choisissez votre schéma de couleurs préféré
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {(themeService.getAvailableSchemes() as ColorScheme[]).map((scheme) => {
                const colors = colorSchemes[scheme];
                return (
                  <button
                    key={scheme}
                    onClick={() => handleColorSchemeChange(scheme)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedColorScheme === scheme
                        ? 'border-current ring-2 ring-offset-2'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                    style={
                      selectedColorScheme === scheme
                        ? { borderColor: colors.primary, '--tw-ring-color': colors.primary } as any
                        : {}
                    }
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex gap-1">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: colors.primary }}
                          title={colors.primary}
                        />
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: colors.secondary }}
                          title={colors.secondary}
                        />
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: colors.accent }}
                          title={colors.accent}
                        />
                      </div>
                      <span className="text-xs font-medium">
                        {themeService.getSchemeLabel(scheme)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
