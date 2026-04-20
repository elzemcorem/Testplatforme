import { useState, useEffect } from 'react';
import { format, isPast, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Calendar,
  Car,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { FutureBookingForm } from './FutureBookingForm';
import { futureBookingsService, type FutureBooking } from '../services/futureBookingsService';
import { vehicleService } from '../services/vehicleService';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../utils/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

interface Vehicle {
  id: string;
  name: string;
  type?: string;
  plate?: string;
}

interface BookingWithVehicle extends FutureBooking {
  vehicle?: Vehicle;
}

export function FutureBookingsPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [userBookings, setUserBookings] = useState<BookingWithVehicle[]>([]);
  const [allBookings, setAllBookings] = useState<FutureBooking[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);
  const [bookingToValidate, setBookingToValidate] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<'confirmed' | 'cancelled'>('confirmed');
  const { currentUser } = useAuth();

  // Vérifier si l'utilisateur est contrôleur - vérifier multiple sources
  const isController = () => {
    if (!currentUser) return false;
    
    // Check role from context (set by AuthContext)
    if (currentUser.role === 'controller') return true;
    
    // Fallback pour backend
    return false;
  };

  useEffect(() => {
    loadData();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('future_bookings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'future_bookings'
        },
        (payload) => {
          console.log('📡 Real-time update received:', payload);
          // Reload data when changes occur
          loadData();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [currentUser?.id]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Charger les véhicules
      const vehicleData = await vehicleService.loadVehicles();
      setVehicles(vehicleData || []);

      // Charger les réservations futures de l'utilisateur
      if (currentUser?.id) {
        const bookings = await futureBookingsService.getAllFutureBookings();
        
        // Filtrer les réservations de l'utilisateur
        const userBookings = bookings?.filter(b => b.user_id === currentUser.id) || [];
        
        // Enrichir avec les infos du véhicule
        const enrichedBookings = userBookings.map(booking => {
          const vehicle = vehicleData?.find(v => v.id === booking.vehicle_id);
          return {
            ...booking,
            vehicle
          };
        });

        setUserBookings(enrichedBookings);
        setAllBookings(bookings || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsFormOpen(true);
  };

  const handleUpdateBookingStatus = async (bookingId: string | undefined, status: 'confirmed' | 'cancelled') => {
    if (!bookingId) return;

    try {
      const { error } = await futureBookingsService.supabase
        .from('future_bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;

      toast.success(status === 'confirmed' ? 'Réservation validée' : 'Réservation annulée');
      setBookingToValidate(null);
      loadData();
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDeleteBooking = async (bookingId: string | undefined) => {
    if (!bookingId) return;

    try {
      // Appeler le service pour supprimer
      const result = await futureBookingsService.cancelFutureBooking(bookingId);
      if (result) {
        toast.success('Réservation annulée');
        setBookingToDelete(null);
        loadData();
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast.error('Erreur lors de l\'annulation');
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1" /> Confirmée</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-yellow-600 text-yellow-700"><Clock className="w-3 h-3 mr-1" /> En attente</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Annulée</Badge>;
      case 'started':
        return <Badge className="bg-blue-600"><Car className="w-3 h-3 mr-1" /> Commencée</Badge>;
      case 'completed':
        return <Badge className="bg-slate-600"><CheckCircle2 className="w-3 h-3 mr-1" /> Terminée</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  const canCancelBooking = (booking: BookingWithVehicle): boolean => {
    if (!booking.planned_start_date) return false;
    const startDate = new Date(booking.planned_start_date);
    // Peut annuler si pas encore commencée
    return !isPast(startDate) && booking.status !== 'cancelled' && booking.status !== 'completed';
  };

  const getAvailabilityInfo = (vehicle: Vehicle): { available: number; booked: number } => {
    const vehicleBookings = allBookings.filter(
      b => b.vehicle_id === vehicle.id && b.status !== 'cancelled'
    );
    return {
      available: Math.max(0, 10 - vehicleBookings.length),
      booked: vehicleBookings.length
    };
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Calendar className="w-8 h-8" />
          Réservations Futures
        </h1>
        <p className="text-muted-foreground mt-1">
          Réservez des véhicules pour les jours, semaines ou mois à venir
        </p>
      </div>

      {/* Grille des véhicules disponibles */}
      <div>
        <h2 className="text-xl font-semibold mb-4">🚗 Sélectionnez un véhicule</h2>
        {vehicles.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">Aucun véhicule disponible</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map((vehicle) => {
              const availability = getAvailabilityInfo(vehicle);
              return (
                <Card key={vehicle.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleSelectVehicle(vehicle)}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{vehicle.name}</CardTitle>
                        <CardDescription className="font-mono text-xs">{vehicle.plate}</CardDescription>
                      </div>
                      <Car className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Réservations:</span>
                        <span className="font-semibold">{availability.booked} / 10</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all"
                          style={{ width: `${(availability.booked / 10) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <Button className="w-full" onClick={() => handleSelectVehicle(vehicle)}>
                      Réserver
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Mes réservations futures */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Mes réservations futures
        </h2>
        
        {userBookings.length === 0 ? (
          <Card className="bg-slate-50 dark:bg-slate-900/50 border-dashed">
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">Vous n'avez pas encore de réservation future</p>
                <Button variant="outline" onClick={() => {
                  setSelectedVehicle(null);
                  setIsFormOpen(true);
                }}>
                  Créer une réservation
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Véhicule</TableHead>
                  <TableHead>Début</TableHead>
                  <TableHead>Fin</TableHead>
                  <TableHead>Durée</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userBookings.map((booking) => {
                  const startDate = new Date(booking.planned_start_date || '');
                  const endDate = new Date(booking.planned_end_date || '');
                  const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

                  return (
                    <TableRow key={booking.id}>
                      <TableCell className="font-semibold">{booking.vehicle?.name || 'N/A'}</TableCell>
                      <TableCell className="text-sm">
                        {format(startDate, 'PPP', { locale: fr })}
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(endDate, 'PPP', { locale: fr })}
                      </TableCell>
                      <TableCell className="text-sm">
                        <Badge variant="outline">{duration} j</Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(booking.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        {canCancelBooking(booking) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setBookingToDelete(booking.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Future Booking Form Dialog */}
      {selectedVehicle && (
        <FutureBookingForm
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedVehicle(null);
          }}
          vehicleName={selectedVehicle.name}
          vehicleId={selectedVehicle.id}
          onSuccess={loadData}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={bookingToDelete !== null} onOpenChange={(open) => !open && setBookingToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler la réservation?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. La réservation sera supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel>Garder</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => handleDeleteBooking(bookingToDelete || undefined)}
            className="bg-destructive hover:bg-destructive/90"
          >
            Annuler la réservation
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toutes les réservations futures (pour contrôleurs et DAF) */}
      {isController() && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Toutes les réservations futures (Validation)
          </h2>
          
          {allBookings.length === 0 ? (
            <Card className="bg-slate-50 dark:bg-slate-900/50 border-dashed">
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">Aucune réservation future en attente</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Véhicule</TableHead>
                    <TableHead>Début</TableHead>
                    <TableHead>Fin</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allBookings
                    .filter(b => b.status === 'pending') // Afficher seulement les réservations en attente
                    .map((booking) => {
                      const startDate = new Date(booking.planned_start_date || '');
                      const endDate = new Date(booking.planned_end_date || '');
                      const vehicle = vehicles.find(v => v.id === booking.vehicle_id);

                      return (
                        <TableRow key={booking.id}>
                          <TableCell className="text-sm">
                            <span className="text-muted-foreground">ID: {booking.user_id?.slice(0, 8)}</span>
                          </TableCell>
                          <TableCell className="font-semibold">{vehicle?.name || 'N/A'}</TableCell>
                          <TableCell className="text-sm">
                            {format(startDate, 'PPP', { locale: fr })}
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(endDate, 'PPP', { locale: fr })}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(booking.status)}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setBookingToValidate(booking.id);
                                setNewStatus('confirmed');
                              }}
                              className="text-green-700 border-green-300 hover:bg-green-50"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Valider
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setBookingToValidate(booking.id);
                                setNewStatus('cancelled');
                              }}
                              className="text-red-700 border-red-300 hover:bg-red-50"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Refuser
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* Validation Confirmation Dialog */}
      <AlertDialog open={bookingToValidate !== null} onOpenChange={(open) => !open && setBookingToValidate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {newStatus === 'confirmed' ? 'Valider la réservation?' : 'Refuser la réservation?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {newStatus === 'confirmed' 
                ? 'Cette réservation sera confirmée et le utilisateur sera notifié.'
                : 'Cette réservation sera annulée et l\'utilisateur en sera notifié.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => handleUpdateBookingStatus(bookingToValidate || undefined, newStatus)}
            className={newStatus === 'confirmed' ? 'bg-green-600 hover:bg-green-700' : 'bg-destructive hover:bg-destructive/90'}
          >
            {newStatus === 'confirmed' ? 'Valider' : 'Refuser'}
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
