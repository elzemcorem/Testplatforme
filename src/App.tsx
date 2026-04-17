import { Layout } from "./components/Layout";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "./components/ui/sonner";
import { useEffect } from "react";
import { themeService } from "./services/themeService";

export default function App() {
  // Initialiser le thème au chargement
  useEffect(() => {
    themeService.initializeTheme();
  }, []);

  return (
    <AuthProvider>
      <Layout />
      <Toaster />
    </AuthProvider>
  );
}