import { useState, useEffect, useRef } from "react";
import { Badge } from "./ui/badge";
import { ReservationStats } from "./ReservationStats";
import { ReservationFilters } from "./ReservationFilters";
import { VehicleCard } from "./VehicleCard";
import { ReservationForm } from "./ReservationForm";
import { useAuth } from "../contexts/AuthContext";
import { reservationService } from "../services/reservationService";
import { vehicleService, Vehicle as VehicleType } from "../services/vehicleService";
import { toast } from "sonner@2.0.3";

export function Dashboard() {
  const [filters, setFilters] = useState({});
  const [isReservationFormOpen, setIsReservationFormOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<{ id: string; name: string } | null>(null);
  const [reservations, setReservations] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const { currentUser } = useAuth();
  const unsubscribeReservationsRef = useRef<(() => void) | null>(null);
  const unsubscribeVehiclesRef = useRef<(() => void) | null>(null);

  // 📥 Charger les réservations et véhicules depuis Supabase en temps réel
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        // Charger les réservations
        const loadedReservations = await reservationService.loadReservations();
        setReservations(loadedReservations);
        console.log("✅ Réservations chargées");

        // Charger les véhicules
        const loadedVehicles = await vehicleService.loadVehicles();
        const mappedVehicles = loadedVehicles.map((v: VehicleType) => ({
          id: v.id,
          name: v.name,
          type: v.type,
          capacity: v.capacity,
          fuelType: v.fuel_type,
          imageData: v.image_data,
        }));
        setVehicles(mappedVehicles);
        console.log("✅ Véhicules chargés:", mappedVehicles.length);

        // S'abonner aux changements de réservations
        const unsubscribeReservations = reservationService.subscribeToReservations(
          (reservation, action) => {
            console.log(`📡 Réservation ${action}:`, reservation.id);
            
            setReservations((prev) => {
              if (action === "created") {
                if (prev.some((r) => r.id === reservation.id)) {
                  return prev;
                }
                return [reservation, ...prev];
              } else if (action === "updated") {
                return prev.map((r) =>
                  r.id === reservation.id ? reservation : r
                );
              } else if (action === "deleted") {
                return prev.filter((r) => r.id !== reservation.id);
              }
              return prev;
            });
          }
        );

        unsubscribeReservationsRef.current = unsubscribeReservations;

        // S'abonner aux changements de véhicules
        const unsubscribeVehicles = vehicleService.subscribeToVehicles(
          (vehicle: VehicleType, action) => {
            console.log(`📡 Véhicule ${action}:`, vehicle.name);
            const mappedVehicle = {
              id: vehicle.id,
              name: vehicle.name,
              type: vehicle.type,
              capacity: vehicle.capacity,
              fuelType: vehicle.fuel_type,
              imageData: vehicle.image_data,
            };

            setVehicles((prev) => {
              if (action === "created") {
                if (prev.some((v: any) => v.id === vehicle.id)) {
                  return prev;
                }
                return [mappedVehicle, ...prev];
              } else if (action === "updated") {
                return prev.map((v: any) =>
                  v.id === vehicle.id ? mappedVehicle : v
                );
              } else if (action === "deleted") {
                return prev.filter((v: any) => v.id !== vehicle.id);
              }
              return prev;
            });
          }
        );

        unsubscribeVehiclesRef.current = unsubscribeVehicles;
      } catch (error) {
        console.error("❌ Erreur lors de l'initialisation:", error);
        toast.error("Erreur lors du chargement des données");
      }
    };

    initializeDashboard();

    return () => {
      if (unsubscribeReservationsRef.current) {
        unsubscribeReservationsRef.current();
        unsubscribeReservationsRef.current = null;
      }
      if (unsubscribeVehiclesRef.current) {
        unsubscribeVehiclesRef.current();
        unsubscribeVehiclesRef.current = null;
      }
    };
  }, []);

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
    // Les réservations se mettront à jour automatiquement via Realtime
  };

  // Vérifier si un véhicule est disponible (pas de réservation pending ou validated)
  const isVehicleAvailable = (vehicleId: string) => {
    const hasActiveReservation = reservations.some(
      (res) => res.vehicleId === vehicleId && 
               (res.status === "pending" || res.status === "validated")
    );
    return !hasActiveReservation;
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
                {vehicles.length} véhicule(s)
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
            {vehicles.length > 0 ? (
              vehicles.map((vehicle) => {
                const available = isVehicleAvailable(vehicle.id);
                return (
                  <VehicleCard 
                    key={vehicle.id} 
                    {...vehicle} 
                    available={available}
                    onReserve={handleReserve} 
                  />
                );
              })
            ) : (
              <div className="col-span-1 md:col-span-2 lg:col-span-3">
                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-8 text-center">
                  <p className="text-amber-800 dark:text-amber-200 font-medium mb-2">
                    ℹ️ Aucun véhicule disponible
                  </p>
                  <p className="text-amber-700 dark:text-amber-300 text-sm">
                    Allez à la section <strong>Configuration</strong> pour ajouter des véhicules
                  </p>
                </div>
              </div>
            )}
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