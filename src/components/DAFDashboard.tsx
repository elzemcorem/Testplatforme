/**
 * DAF Dashboard
 * Dashboard spécialisé pour le DAF avec suivi temps réel des actions du contrôleur
 */

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
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
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ReservationCalendar } from './ReservationCalendar';
import { dafRealtimeService, type ControllerAction } from '../services/dafRealtimeService';
import { futureBookingsService, type FutureBooking } from '../services/futureBookingsService';
import { toast } from 'sonner@2.0.3';

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
  const [futureBookings, setFutureBookings] = useState<FutureBooking[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Initialiser les listeners Realtime
    dafRealtimeService.initializeRealtimeListeners();
    
    // Charger les données initiales
    loadDashboardData();
    
    // Ajouter un listener pour les notifications en temps réel
    const handleNotification = () => {
      // Recharger les données quand une notification arrive
      loadDashboardData();
    };
    
    dafRealtimeService.onNotification(handleNotification);
    
    // Rafraîchir automatiquement toutes les 30 secondes
    const interval = setInterval(loadDashboardData, 30000);
    
    return () => {
      clearInterval(interval);
      dafRealtimeService.offNotification(handleNotification);
      dafRealtimeService.unsubscribeAll();
    };
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Charger les actions récentes
      const actions = await dafRealtimeService.getControllerActionsHistory(20);
      setRecentActions(actions);

      // Charger les future bookings
      const bookings = await futureBookingsService.getAllFutureBookings();
      setFutureBookings(bookings);

      // Calculer les stats
      const stats: DAFStats = {
        totalValidations: actions.filter(a => a.action_type === 'validated').length,
        totalCancellations: actions.filter(a => a.action_type === 'cancelled').length,
        totalModifications: actions.filter(a => a.action_type === 'modified').length,
        totalFutureBookings: bookings.length,
        pendingBookings: bookings.filter(b => b.status === 'pending').length
      };
      
      setStats(stats);
    } catch (error) {
      console.error('Error loading DAF dashboard:', error);
      toast.error('Erreur lors du chargement des données');
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
    <div className="space-y-6 bg-background min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard DAF</h1>
          <p className="text-muted-foreground mt-1">
            Suivi en temps réel des réservations et actions du contrôleur
          </p>
        </div>
        <Button
          onClick={loadDashboardData}
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Rafraîchir
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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

      {/* Actions Récentes du Contrôleur */}
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

      {/* Future Bookings En Attente */}
      {stats.pendingBookings > 0 && (
        <Card className="border-2 border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <AlertCircle className="w-5 h-5" />
              Réservations planifiées en attente
            </CardTitle>
            <CardDescription>
              {stats.pendingBookings} réservation{stats.pendingBookings > 1 ? 's' : ''} à confirmer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {futureBookings
                .filter(b => b.status === 'pending')
                .slice(0, 5)
                .map(booking => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded border border-yellow-200"
                  >
                    <div className="text-sm">
                      <div className="font-medium">
                        {booking.vehicle.model} ({booking.vehicle.registration_number})
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(booking.planned_start_date), 'dd MMM yyyy')} → {format(new Date(booking.planned_end_date), 'dd MMM yyyy')}
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                      En attente
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
