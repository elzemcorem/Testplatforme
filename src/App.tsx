import { Layout } from "./components/Layout";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  return (
    <AuthProvider>
      <Layout />
      <Toaster />
    </AuthProvider>
  );
}