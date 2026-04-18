import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Dashboard } from "./Dashboard";
import { ReservationAnalyticsSimple } from "./ReservationAnalyticsSimple";
import { VehicleConfiguration } from "./VehicleConfiguration";
import { ReservationReports } from "./ReservationReports";
import { UserSettings } from "./UserSettings";
import { Chat } from "./Chat";
import { ReservationsPage } from "./ReservationsPage";
import { AccountManagement } from "./AccountManagement";
import { VehicleChecklist } from "./VehicleChecklist";
import { ReportsPage } from "./ReportsPage";
import { ExitReportsPage } from "./ExitReportsPage";
import { IntelligentHelpPage } from "./IntelligentHelpPage";
import { LoginPage } from "./LoginPage";
import { MyReservations } from "./MyReservations";
import { NotificationBell } from "./NotificationBell";
import { DAFDashboard } from "./DAFDashboard";
import { DAFNotificationPanel } from "./DAFNotificationPanel";
import { useAuth } from "../contexts/AuthContext";

export function Layout() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const { currentUser, isLoading } = useAuth();

  // Afficher un loader pendant le chargement
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // Si l'utilisateur n'est pas connecté, afficher la page de connexion
  if (!currentUser) {
    return <LoginPage />;
  }

  const renderContent = () => {
    const { role, isDAF } = currentUser;

    // DAF a son propre dashboard spécialisé
    if (isDAF) {
      switch (currentPage) {
        case "dashboard":
          return <DAFDashboard />;
        case "settings":
          return <UserSettings />;
        default:
          return <DAFDashboard />;
      }
    }

    // Admin a accès à tout
    if (role === "admin") {
      switch (currentPage) {
        case "dashboard":
          return <Dashboard />;
        case "reservations":
          return <ReservationsPage />;
        case "analytics":
          return <ReservationAnalyticsSimple />;
        case "configuration":
          return <VehicleConfiguration />;
        case "reports":
          return <ReservationReports />;
        case "accounts":
          return <AccountManagement />;
        case "chat":
          return <Chat />;
        case "help":
          return <IntelligentHelpPage />;
        case "settings":
          return <UserSettings />;
        default:
          return <Dashboard />;
      }
    }

    // Contrôleur a accès limité
    if (role === "controller") {
      switch (currentPage) {
        case "dashboard":
          return <Dashboard />;
        case "reservations":
          return <ReservationsPage />;
        case "configuration":
          return <VehicleConfiguration />;
        case "checklist":
          return <VehicleChecklist />;
        case "reports":
          return <ReportsPage />;
        case "exit-reports":
          return <ExitReportsPage />;
        case "chat":
          return <Chat />;
        case "help":
          return <IntelligentHelpPage />;
        case "settings":
          return <UserSettings />;
        default:
          return <Dashboard />;
      }
    }

    // Utilisateur normal a accès très limité
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
      case "reservations":
        return <MyReservations />;
      case "chat":
        return <Chat />;
      case "help":
        return <IntelligentHelpPage />;
      case "settings":
        return <UserSettings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-shrink-0">
        <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      </div>
      <main className="flex-1 overflow-auto relative">
        {/* Notification Bell - Top Right */}
        <div className="absolute top-4 right-6 z-50">
          <NotificationBell />
        </div>
        {/* DAF Notification Panel pour temps réel */}
        <DAFNotificationPanel isDAF={currentUser?.isDAF || false} />
        {renderContent()}
      </main>
    </div>
  );
}