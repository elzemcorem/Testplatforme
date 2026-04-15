import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Car, CalendarCheck, Clock, Users } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  subtitle?: string;
}

function StatCard({ title, value, icon: Icon, subtitle }: StatCardProps) {
  return (
    <Card className="p-6 border-2 border-primary/20 hover:border-primary/40 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </Card>
  );
}

export function ReservationStats() {
  const { currentUser } = useAuth();
  const [reservations, setReservations] = useState<any[]>([]);
  const [allAccounts, setAllAccounts] = useState<any[]>([]);

  useEffect(() => {
    loadReservations();
    loadAccounts();
    const interval = setInterval(() => {
      loadReservations();
      loadAccounts();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadReservations = () => {
    const stored = localStorage.getItem("reservations");
    if (stored) {
      try {
        setReservations(JSON.parse(stored));
      } catch (error) {
        console.error("Error loading reservations:", error);
      }
    }
  };

  const loadAccounts = () => {
    const stored = localStorage.getItem("all_accounts");
    if (stored) {
      try {
        setAllAccounts(JSON.parse(stored));
      } catch (error) {
        console.error("Error loading accounts:", error);
      }
    }
  };

  const totalVehicles = 3; // Total de véhicules sur la plateforme
  const availableVehicles = totalVehicles - reservations.filter(
    (res) => res.status === "pending" || res.status === "validated"
  ).length;
  
  const activeReservations = reservations.filter(
    (res) => res.status === "validated"
  ).length;

  const today = new Date().toDateString();
  const todayReservations = reservations.filter(
    (res) => new Date(res.createdAt).toDateString() === today
  ).length;

  const userCount = allAccounts.length;

  // Définir le nombre de colonnes selon le rôle
  const gridCols = currentUser?.role === "admin" 
    ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4" 
    : "grid-cols-1 md:grid-cols-3";

  return (
    <div className={`grid ${gridCols} gap-6`}>
      <StatCard
        title="Véhicules Disponibles"
        value={availableVehicles}
        icon={Car}
        subtitle={`Sur ${totalVehicles} véhicules`}
      />
      <StatCard
        title="Réservations Actives"
        value={activeReservations}
        icon={CalendarCheck}
        subtitle="Validées"
      />
      <StatCard
        title="Réservations Aujourd'hui"
        value={todayReservations}
        icon={Clock}
        subtitle="Nouvelles"
      />
      {/* Afficher les utilisateurs inscrits uniquement pour l'admin */}
      {currentUser?.role === "admin" && (
        <StatCard
          title="Utilisateurs Inscrits"
          value={`${userCount}/100`}
          icon={Users}
          subtitle="Maximum 100 utilisateurs"
        />
      )}
    </div>
  );
}