import { useState } from 'react';
import { Badge } from './ui/badge';
import { ReservationStats } from './ReservationStats';
import { ReservationFilters } from './ReservationFilters';
import { VehicleCard } from './VehicleCard';
import { ReservationForm } from './ReservationForm';
import { useAuth } from '../contexts/AuthContext';
import { useVehicles } from '../hooks/useVehicles';
import { useReservations } from '../hooks/useReservations';
import { Skeleton } from './ui/skeleton';

export function Dashboard() {
  const [filters, setFilters] = useState({});
  const [isReservationFormOpen, setIsReservationFormOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<{ id: string; name: string } | null>(null);
  const { currentUser } = useAuth();

  // ✅ Données depuis Supabase — plus de localStorage
  const { vehicles, loading: vehiclesLoading } = useVehicles();
  const { reservations } = useReservations();

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleReserve = (vehicleId: string, vehicleName: string) => {
    setSelectedVehicle({ id: vehicleId, name: vehicleName });
    setIsReservationFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsReservationFormOpen(false);
    setSelectedVehicle(null);
    // Pas besoin de reload manuellement — le Realtime s'en charge
  };

  // Vérifier la disponibilité depuis les données Supabase (Realtime)
  const isVehicleAvailable = (vehicleId: string) => {
    return !reservations.some(
      (res) =>
        res.vehicle_id === vehicleId &&
        (res.status === 'pending' || res.status === 'validated')
    );
  };

  const availableCount = vehicles.filter((v) => v.is_available && isVehicleAvailable(v.id)).length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8faf9' }}>
      <div className="p-6 space-y-6">
        {/* Header */}
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
            <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1.5">
              <div className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse" />
              {availableCount} véhicule{availableCount !== 1 ? 's' : ''} disponible{availableCount !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        {/* Statistiques */}
        <ReservationStats />

        {/* Filtres */}
        <ReservationFilters onFilterChange={handleFilterChange} />

        {/* Liste des véhicules */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Véhicules disponibles</h2>
            <p className="text-sm text-muted-foreground">
              {vehicles.length} véhicule{vehicles.length !== 1 ? 's' : ''} au total
            </p>
          </div>

          {vehiclesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map((vehicle) => {
                const available = vehicle.is_available && isVehicleAvailable(vehicle.id);
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
          )}
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
