/**
 * DAF Dashboard
 * Dashboard spécialisé pour le DAF avec suivi temps réel des actions du contrôleur
 */

import { useState, useEffect } from 'react';
import { format, differenceInDays, isToday, isTomorrow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  Users,
  Activity,
  RefreshCw,
  Wifi,
  WifiOff,
  Calendar as CalendarIcon
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ReservationCalendar } from './ReservationCalendar';
import { dafRealtimeService, type ControllerAction } from '../services/dafRealtimeService';
import { futureBookingsService, type FutureBooking } from '../services/futureBookingsService';
import { vehicleService } from '../services/vehicleService';
import { supabase } from '../utils/supabase/client';
import { toast } from 'sonner';

interface Vehicle {
  id: string;
  name?: string;
  model?: string;
  registration_number?: string;
}

interface User {
  name: string;
  email: string;
}

interface EnrichedFutureBooking extends FutureBooking {
  vehicle?: Vehicle;
  user?: User;
}

interface DAFStats {
  totalValidations: number;
  totalCancellations: number;
  totalModifications: number;
  totalFutureBookings: number;
  pendingBookings: number;
}

export function DAFDashboard() {
  const [stats, setStats] = useState<DAFStats>({
    totalValidations: 0,
    totalCancellations: 0,
    totalModifications: 0,
    totalFutureBookings: 0,
    pendingBookings: 0
  });
  
  const [recentActions, setRecentActions] = useState<ControllerAction[]>([]);
  const [futureBookings, setFutureBookings] = useState<EnrichedFutureBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  useEffect(() => {
    console.log('[DAFDashboard] Initializing DAF Dashboard');
    
    try {
      // Initialiser les listeners Realtime
      console.log('[DAFDashboard] Initializing Realtime listeners');
      dafRealtimeService.initializeRealtimeListeners();
      
      // Ajouter un listener Realtime direct pour future_bookings
      const futureBookingsChannel = supabase
        .channel('future_bookings_daf')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'future_bookings'
          },
          (payload) => {
            console.log('[DAFDashboard] Realtime update on future_bookings:', payload);
            setIsRealtimeConnected(true);
            // Recharger les données immédiatement
            setTimeout(() => loadDashboardData(), 100);
          }
        )
        .subscribe((status) => {
          console.log('[DAFDashboard] Future bookings channel status:', status);
          if (status === 'SUBSCRIBED') {
            setIsRealtimeConnected(true);
            toast.success('✅ Connecté en temps réel', { duration: 2000 });
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            setIsRealtimeConnected(false);
          }
        });
      
      // Charger les données initiales
      loadDashboardData();
      
      // Ajouter un listener pour les notifications en temps réel
      const handleNotification = () => {
        console.log('[DAFDashboard] Notification received, reloading data');
        // Recharger les données quand une notification arrive
        loadDashboardData();
      };
      
      dafRealtimeService.onNotification(handleNotification);
      
      // Rafraîchir automatiquement toutes les 30 secondes (fallback)
      const interval = setInterval(() => {
        console.log('[DAFDashboard] Polling refresh (30s interval)');
        loadDashboardData();
      }, 30000);
      
      return () => {
        clearInterval(interval);
        dafRealtimeService.offNotification(handleNotification);
        dafRealtimeService.unsubscribeAll();
        futureBookingsChannel.unsubscribe();
      };
    } catch (err) {
      console.error('[DAFDashboard] Error initializing:', err);
      setError('Erreur lors de l\'initialisation du tableau de bord');
      setIsLoading(false);
    }
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('[DAFDashboard] Loading controller actions...');
      // Charger les actions récentes
      const actions = await dafRealtimeService.getControllerActionsHistory(20);
      console.log('[DAFDashboard] Loaded actions:', actions);
      setRecentActions(actions || []);

      console.log('[DAFDashboard] Loading future bookings...');
      // Charger les future bookings
      const bookings = await futureBookingsService.getAllFutureBookings();
      
      // Charger les véhicules pour enrichir les bookings
      const vehicles = await vehicleService.loadVehicles();
      const vehiclesMap = new Map(vehicles?.map(v => [v.id, v]) || []);
      
      // Charger les utilisateurs depuis allowed_users pour enrichir les bookings
      const { data: allowedUsers, error: usersError } = await supabase
        .from('allowed_users')
        .select('id, email, noms')
        .not('id', 'is', null);
      
      const usersMap = new Map<string, { name: string; email: string }>();
      if (allowedUsers && !usersError) {
        allowedUsers.forEach(user => {
          usersMap.set(user.id, { 
            name: user.noms || 'Unknown', 
            email: user.email 
          });
        });
      }
      
      // Enrichir les bookings avec les infos des véhicules ET utilisateurs
      const enrichedBookings = (bookings || []).map(booking => ({
        ...booking,
        vehicle: vehiclesMap.get(booking.vehicle_id) || { 
          id: booking.vehicle_id, 
          name: 'Véhicule inconnu',
          model: 'N/A',
          registration_number: 'N/A'
        },
        user: usersMap.get(booking.user_id) || {
          name: 'Utilisateur inconnu',
          email: '—'
        }
      }));
      
      console.log('[DAFDashboard] Loaded bookings:', enrichedBookings);
      setFutureBookings(enrichedBookings);

      // Calculer les stats
      const stats: DAFStats = {
        totalValidations: (actions || []).filter(a => a.action_type === 'validated').length,
        totalCancellations: (actions || []).filter(a => a.action_type === 'cancelled').length,
        totalModifications: (actions || []).filter(a => a.action_type === 'modified').length,
        totalFutureBookings: enrichedBookings.length,
        pendingBookings: enrichedBookings.filter(b => b.status === 'pending').length
      };
      
      console.log('[DAFDashboard] Stats:', stats);
      setStats(stats);
    } catch (error) {
      console.error('[DAFDashboard] Error loading DAF dashboard:', error);
      const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
      setError(`Erreur: ${errorMsg}`);
      // Ne pas afficher de toast ici, le composant affichera le message
    } finally {
      setIsLoading(false);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'validated':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'modified':
        return <AlertCircle className="w-4 h-4 text-blue-600" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getActionLabel = (actionType: string) => {
    switch (actionType) {
      case 'validated':
        return 'Validée';
      case 'cancelled':
        return 'Annulée';
      case 'modified':
        return 'Modifiée';
      default:
        return actionType;
    }
  };

  return (
    <div className="bg-background min-h-screen p-4 md:p-6 lg:p-8 space-y-6 overflow-x-hidden">
      {/* Loading State */}
      {isLoading && recentActions.length === 0 && futureBookings.length === 0 && (
        <div className="min-h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement du tableau de bord DAF...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-2 border-red-300 bg-red-50 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Erreur
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <p className="text-sm text-muted-foreground mt-2">
              ⚠️ Assurez-vous que les tables Supabase sont créées en exécutant le SQL dans Supabase Dashboard.
            </p>
            <Button onClick={loadDashboardData} className="mt-4" variant="outline">
              Réessayer
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {!error && (
        <>
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Dashboard DAF</h1>
              <p className="text-muted-foreground mt-1">
                Suivi en temps réel des réservations et actions du contrôleur
              </p>
            </div>
            <Button
              onClick={loadDashboardData}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="w-fit"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Rafraîchir
            </Button>
          </div>

          {/* Stats Cards - Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
            <Card className="border-2 border-green-200 min-h-[120px]">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs md:text-sm font-medium text-green-700">
                  Validées
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl md:text-3xl font-bold">{stats.totalValidations}</div>
                  <CheckCircle2 className="w-6 md:w-8 h-6 md:h-8 text-green-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-red-200 min-h-[120px]">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs md:text-sm font-medium text-red-700">
                  Annulées
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl md:text-3xl font-bold">{stats.totalCancellations}</div>
                  <XCircle className="w-6 md:w-8 h-6 md:h-8 text-red-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-200 min-h-[120px]">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs md:text-sm font-medium text-blue-700">
                  Modifiées
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl md:text-3xl font-bold">{stats.totalModifications}</div>
                  <AlertCircle className="w-6 md:w-8 h-6 md:h-8 text-blue-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-200 min-h-[120px]">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs md:text-sm font-medium text-purple-700">
                  Planifiées
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl md:text-3xl font-bold">{stats.totalFutureBookings}</div>
                  <Clock className="w-6 md:w-8 h-6 md:h-8 text-purple-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-yellow-200 min-h-[120px]">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs md:text-sm font-medium text-yellow-700">
                  En attente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl md:text-3xl font-bold">{stats.pendingBookings}</div>
                  <TrendingUp className="w-6 md:w-8 h-6 md:h-8 text-yellow-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Calendar - Full Width */}
          <ReservationCalendar futureBookings={futureBookings} showFutureOnly={true} />

          {/* Bookings Dashboard */}
          <Card className="border-2 border-blue-200">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-blue-700" />
                  <div>
                    <CardTitle>Réservations planifiées - Tableau de bord</CardTitle>
                    <CardDescription className="mt-1">
                      {stats.totalFutureBookings} réservation{stats.totalFutureBookings !== 1 ? 's' : ''} planifiée{stats.totalFutureBookings !== 1 ? 's' : ''} 
                      {' • '} 
                      {stats.pendingBookings} en attente {' • '}
                      <span className={`inline-flex items-center gap-1 ${isRealtimeConnected ? 'text-green-600' : 'text-red-600'}`}>
                        {isRealtimeConnected ? (
                          <>
                            <Wifi className="w-3 h-3" />
                            Temps réel ✓
                          </>
                        ) : (
                          <>
                            <WifiOff className="w-3 h-3" />
                            Polling uniquement
                          </>
                        )}
                      </span>
                    </CardDescription>
                  </div>
                </div>
                <Button onClick={loadDashboardData} disabled={isLoading} variant="outline" size="sm" className="w-full md:w-fit">
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {futureBookings.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="w-12 h-12 text-muted-foreground opacity-20 mx-auto mb-2" />
                  <p className="text-muted-foreground">Aucune réservation planifiée</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-6 sm:-mx-4">
                  <div className="px-6 sm:px-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[150px]">Véhicule</TableHead>
                          <TableHead className="min-w-[150px]">Dates</TableHead>
                          <TableHead className="min-w-[80px]">Durée</TableHead>
                          <TableHead className="min-w-[150px]">Utilisateur</TableHead>
                          <TableHead className="min-w-[100px]">Statut</TableHead>
                          <TableHead className="min-w-[150px]">Prochaines étapes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {futureBookings.map(booking => {
                          const startDate = new Date(booking.planned_start_date);
                          const endDate = new Date(booking.planned_end_date);
                          const days = differenceInDays(endDate, startDate) + 1;
                          const vehicleName = booking.vehicle?.model || booking.vehicle?.name || 'Véhicule inconnu';
                          const registrationNumber = booking.vehicle?.registration_number || 'N/A';
                          
                          let dateLabel = '';
                          if (isToday(startDate)) {
                            dateLabel = 'Aujourd\'hui';
                          } else if (isTomorrow(startDate)) {
                            dateLabel = 'Demain';
                          } else {
                            dateLabel = format(startDate, 'dd MMM', { locale: fr });
                          }
                          
                          const getStatusBadge = () => {
                            switch (booking.status) {
                              case 'pending':
                                return <Badge className="bg-yellow-100 text-yellow-800">⏳ En attente</Badge>;
                              case 'confirmed':
                                return <Badge className="bg-green-100 text-green-800">✅ Confirmée</Badge>;
                              case 'cancelled':
                                return <Badge className="bg-red-100 text-red-800">❌ Annulée</Badge>;
                              case 'started':
                                return <Badge className="bg-blue-100 text-blue-800">▶️ En cours</Badge>;
                              case 'completed':
                                return <Badge className="bg-gray-100 text-gray-800">✓ Terminée</Badge>;
                              default:
                                return <Badge variant="outline">{booking.status}</Badge>;
                            }
                          };
                          
                          const getNextStep = () => {
                            if (booking.status === 'pending') {
                              return '👤 Contrôleur doit valider';
                            } else if (booking.status === 'confirmed' && startDate > new Date()) {
                              return '⏰ En attente du début';
                            } else if (booking.status === 'confirmed' && startDate <= new Date()) {
                              return '▶️ Doit être marquée "En cours"';
                            } else if (booking.status === 'started') {
                              return '🏁 En attente de fin';
                            }
                            return '—';
                          };
                          
                          return (
                            <TableRow key={booking.id} className="hover:bg-muted/50">
                              <TableCell>
                                <div className="text-sm">
                                  <div className="font-medium truncate">{vehicleName}</div>
                                  <div className="text-xs text-muted-foreground truncate">{registrationNumber}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div>{dateLabel}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {format(startDate, 'HH:mm')} → {format(endDate, 'HH:mm')}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {days} jour{days > 1 ? 's' : ''}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="font-medium truncate">{booking.user?.name || '—'}</div>
                                  <div className="text-xs text-muted-foreground truncate">{booking.user?.email || '—'}</div>
                                </div>
                              </TableCell>
                              <TableCell>{getStatusBadge()}</TableCell>
                              <TableCell>
                                <div className="text-xs text-muted-foreground">
                                  {getNextStep()}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Actions */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Actions récentes du contrôleur
              </CardTitle>
              <CardDescription>
                Historique des validations, annulations et modifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-6 sm:-mx-4">
                <div className="px-6 sm:px-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[120px]">Action</TableHead>
                        <TableHead className="min-w-[100px]">Ancien statut</TableHead>
                        <TableHead className="min-w-[100px]">Nouveau statut</TableHead>
                        <TableHead className="min-w-[150px]">Raison</TableHead>
                        <TableHead className="min-w-[120px]">Heure</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentActions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                            Aucune action enregistrée
                          </TableCell>
                        </TableRow>
                      ) : (
                        recentActions.map(action => (
                          <TableRow key={action.id} className="hover:bg-muted/50">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getActionIcon(action.action_type)}
                                <span className="capitalize font-medium">
                                  {getActionLabel(action.action_type)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{action.old_status}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{action.new_status}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {action.reason || '—'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(action.timestamp), 'dd MMM HH:mm', { locale: fr })}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
            <Card className="border-2 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700">
              Validées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.totalValidations}</div>
              <CheckCircle2 className="w-8 h-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700">
              Annulées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.totalCancellations}</div>
              <XCircle className="w-8 h-8 text-red-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">
              Modifiées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.totalModifications}</div>
              <AlertCircle className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">
              Planifiées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.totalFutureBookings}</div>
              <Clock className="w-8 h-8 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">
              En attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.pendingBookings}</div>
              <TrendingUp className="w-8 h-8 text-yellow-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendrier */}
      <ReservationCalendar futureBookings={futureBookings} showFutureOnly={true} />

      {/* Future Bookings - Tous les statuts avec détails complets */}
      <Card className="border-2 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-blue-700" />
              <div>
                <CardTitle>Réservations planifiées - Tableau de bord</CardTitle>
                <CardDescription>
                  {stats.totalFutureBookings} réservation{stats.totalFutureBookings !== 1 ? 's' : ''} planifiée{stats.totalFutureBookings !== 1 ? 's' : ''} 
                  {' • '} 
                  {stats.pendingBookings} en attente {' • '}
                  <span className={`inline-flex items-center gap-1 ${isRealtimeConnected ? 'text-green-600' : 'text-red-600'}`}>
                    {isRealtimeConnected ? (
                      <>
                        <Wifi className="w-3 h-3" />
                        Temps réel ✓
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-3 h-3" />
                        Polling uniquement
                      </>
                    )}
                  </span>
                </CardDescription>
              </div>
            </div>
            <Button onClick={loadDashboardData} disabled={isLoading} variant="outline" size="sm">
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {futureBookings.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="w-12 h-12 text-muted-foreground opacity-20 mx-auto mb-2" />
              <p className="text-muted-foreground">Aucune réservation planifiée</p>
            </div>
          ) : (
            <div className="space-y-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Véhicule</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Durée</TableHead>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Prochaines étapes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {futureBookings.map(booking => {
                      const startDate = new Date(booking.planned_start_date);
                      const endDate = new Date(booking.planned_end_date);
                      const days = differenceInDays(endDate, startDate) + 1;
                      const vehicleName = booking.vehicle?.model || booking.vehicle?.name || 'Véhicule inconnu';
                      const registrationNumber = booking.vehicle?.registration_number || 'N/A';
                      
                      let dateLabel = '';
                      if (isToday(startDate)) {
                        dateLabel = 'Aujourd\'hui';
                      } else if (isTomorrow(startDate)) {
                        dateLabel = 'Demain';
                      } else {
                        dateLabel = format(startDate, 'dd MMM', { locale: fr });
                      }
                      
                      const getStatusBadge = () => {
                        switch (booking.status) {
                          case 'pending':
                            return <Badge className="bg-yellow-100 text-yellow-800">⏳ En attente</Badge>;
                          case 'confirmed':
                            return <Badge className="bg-green-100 text-green-800">✅ Confirmée</Badge>;
                          case 'cancelled':
                            return <Badge className="bg-red-100 text-red-800">❌ Annulée</Badge>;
                          case 'started':
                            return <Badge className="bg-blue-100 text-blue-800">▶️ En cours</Badge>;
                          case 'completed':
                            return <Badge className="bg-gray-100 text-gray-800">✓ Terminée</Badge>;
                          default:
                            return <Badge variant="outline">{booking.status}</Badge>;
                        }
                      };
                      
                      const getNextStep = () => {
                        if (booking.status === 'pending') {
                          return '👤 Contrôleur doit valider';
                        } else if (booking.status === 'confirmed' && startDate > new Date()) {
                          return '⏰ En attente du début';
                        } else if (booking.status === 'confirmed' && startDate <= new Date()) {
                          return '▶️ Doit être marquée "En cours"';
                        } else if (booking.status === 'started') {
                          return '🏁 En attente de fin';
                        }
                        return '—';
                      };
                      
                      return (
                        <TableRow key={booking.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">{vehicleName}</div>
                              <div className="text-xs text-muted-foreground">{registrationNumber}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{dateLabel}</div>
                              <div className="text-xs text-muted-foreground">
                                {format(startDate, 'HH:mm')} → {format(endDate, 'HH:mm')}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {days} jour{days > 1 ? 's' : ''}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">{booking.user?.name || '—'}</div>
                              <div className="text-xs text-muted-foreground">{booking.user?.email || '—'}</div>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge()}</TableCell>
                          <TableCell>
                            <div className="text-xs text-muted-foreground">
                              {getNextStep()}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Actions récentes du contrôleur
          </CardTitle>
          <CardDescription>
            Historique des validations, annulations et modifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Ancien statut</TableHead>
                  <TableHead>Nouveau statut</TableHead>
                  <TableHead>Raison</TableHead>
                  <TableHead>Heure</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                      Aucune action enregistrée
                    </TableCell>
                  </TableRow>
                ) : (
                  recentActions.map(action => (
                    <TableRow key={action.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getActionIcon(action.action_type)}
                          <span className="capitalize font-medium">
                            {getActionLabel(action.action_type)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{action.old_status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{action.new_status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {action.reason || '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(action.timestamp), 'dd MMM HH:mm', { locale: fr })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      </>
      )}
    </div>
  );
}
