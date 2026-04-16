import { useState, useEffect } from "react";
import { Badge } from "./ui/badge";
import { ReservationStats } from "./ReservationStats";
import { ReservationFilters } from "./ReservationFilters";
import { VehicleCard } from "./VehicleCard";
import { ReservationForm } from "./ReservationForm";
import { useAuth } from "../contexts/AuthContext";

export function Dashboard() {
  const [filters, setFilters] = useState({});
  const [isReservationFormOpen, setIsReservationFormOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<{ id: string; name: string } | null>(null);
  const [reservations, setReservations] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const { currentUser } = useAuth();

  // Charger les réservations pour déterminer la disponibilité
  useEffect(() => {
    loadReservations();
    loadVehicles();
    const interval = setInterval(() => {
      loadReservations();
      loadVehicles();
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

  const loadVehicles = () => {
    const stored = localStorage.getItem("vehicles");
    if (stored) {
      try {
        setVehicles(JSON.parse(stored));
      } catch (error) {
        console.error("Error loading vehicles:", error);
        initializeDefaultVehicles();
      }
    } else {
      initializeDefaultVehicles();
    }
  };

  const initializeDefaultVehicles = () => {
    const defaultVehicles = [
      {
        id: "1",
        name: "Toyota Corolla",
        type: "Berline",
        capacity: 5,
        fuelType: "Essence",
      },
      {
        id: "2",
        name: "Honda CR-V",
        type: "SUV",
        capacity: 7,
        fuelType: "Diesel",
      },
      {
        id: "3",
        name: "Toyota Hiace",
        type: "Minibus",
        capacity: 14,
        fuelType: "Diesel",
      },
    ];
    setVehicles(defaultVehicles);
    localStorage.setItem("vehicles", JSON.stringify(defaultVehicles));
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    console.log("Filtres appliqués:", newFilters);
  };

  const handleReserve = (vehicleId: string, vehicleName: string) => {
    setSelectedVehicle({ id: vehicleId, name: vehicleName });
    setIsReservationFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsReservationFormOpen(false);
    setSelectedVehicle(null);
    loadReservations(); // Recharger pour mettre à jour la disponibilité
  };

  // Vérifier si un véhicule a une réservation en attente ou validée
  const isVehicleAvailable = (vehicleId: string) => {
    return !reservations.some(
      (res) => res.vehicleId === vehicleId && (res.status === "pending" || res.status === "validated")
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8faf9' }}>
      <div className="p-6 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Bonjour, {currentUser?.name || 'Utilisateur'}! 👋
              </h1>
              <p className="text-muted-foreground mt-1">
                Quel véhicule recherchez-vous aujourd'hui ?
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1.5">
                <div className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse"></div>
                {vehicles.filter(v => v.available).length} véhicules disponibles
              </Badge>
            </div>
          </div>
        </div>

        {/* Statistiques de réservation */}
        <ReservationStats />

        {/* Filtres de recherche */}
        <ReservationFilters onFilterChange={handleFilterChange} />

        {/* Liste des véhicules */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Véhicules disponibles</h2>
            <p className="text-sm text-muted-foreground">
              {vehicles.length} véhicules au total
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => {
              const available = isVehicleAvailable(vehicle.id);
              return (
                <VehicleCard 
                  key={vehicle.id} 
                  {...vehicle} 
                  available={available}
                  onReserve={handleReserve} 
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Formulaire de réservation */}
      {selectedVehicle && (
        <ReservationForm
          isOpen={isReservationFormOpen}
          onClose={handleCloseForm}
          vehicleId={selectedVehicle.id}
          vehicleName={selectedVehicle.name}
        />
      )}
    </div>
  );
}