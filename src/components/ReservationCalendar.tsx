/**
 * Reservation Calendar
 * Affiche les réservations avec vue mensuelle et vue Gantt
 */

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar, List } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn } from './ui/utils';
import { futureBookingsService } from '../services/futureBookingsService';

interface Reservation {
  id: string;
  vehicle: { model: string; registration_number: string };
  start_date: string;
  end_date: string;
  status: string;
}

interface FutureBooking {
  id: string;
  planned_start_date: string;
  planned_end_date: string;
  status: string;
  vehicle: { model: string; registration_number: string };
  user?: { email: string; name: string };
}

interface ReservationCalendarProps {
  reservations?: Reservation[];
  futureBookings?: FutureBooking[];
  showFutureOnly?: boolean;
}

export function ReservationCalendar({
  reservations = [],
  futureBookings = [],
  showFutureOnly = false
}: ReservationCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'timeline'>('calendar');
  const [filteredBookings, setFilteredBookings] = useState<FutureBooking[]>([]);

  useEffect(() => {
    loadBookings();
  }, [showFutureOnly]);

  // Mettre à jour quand les props changent
  useEffect(() => {
    if (futureBookings && futureBookings.length > 0) {
      setFilteredBookings(futureBookings);
    } else if (showFutureOnly) {
      loadBookings();
    }
  }, [futureBookings, showFutureOnly]);

  const loadBookings = async () => {
    if (showFutureOnly) {
      const bookings = await futureBookingsService.getAllFutureBookings();
      setFilteredBookings(bookings);
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Padding pour les jours avant et après le mois
  const firstDay = monthStart.getDay();
  const daysBeforeMonth = Array(firstDay).fill(null);

  const getBookingsForDay = (day: Date) => {
    return filteredBookings.filter(booking => {
      const bookingStart = new Date(booking.planned_start_date);
      const bookingEnd = new Date(booking.planned_end_date);
      return isSameDay(day, bookingStart) || isSameDay(day, bookingEnd) ||
             (day > bookingStart && day < bookingEnd);
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'started':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Calendrier des réservations
            </CardTitle>
            <CardDescription>
              Vue des réservations planifiées
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('calendar')}
            >
              <Calendar className="w-4 h-4 mr-1" />
              Mensuelle
            </Button>
            <Button
              variant={viewMode === 'timeline' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('timeline')}
            >
              <List className="w-4 h-4 mr-1" />
              Timeline
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {viewMode === 'calendar' ? (
          <>
            {/* Header du calendrier */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <h3 className="text-lg font-semibold">
                {format(currentMonth, 'MMMM yyyy', { locale: fr })}
              </h3>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Jours de la semaine */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                <div
                  key={day}
                  className="p-2 text-center font-semibold text-sm text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Grille du calendrier */}
            <div className="grid grid-cols-7 gap-1 bg-gray-50 dark:bg-gray-900 p-2 rounded-lg">
              {daysBeforeMonth.map((_, idx) => (
                <div key={`empty-${idx}`} className="aspect-square" />
              ))}
              
              {daysInMonth.map(day => {
                const dayBookings = getBookingsForDay(day);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                
                return (
                  <div
                    key={day.toString()}
                    className={cn(
                      "aspect-square p-1 rounded border text-xs overflow-hidden",
                      !isCurrentMonth && "opacity-30",
                      "bg-white dark:bg-slate-800"
                    )}
                  >
                    <div className="font-semibold text-sm mb-1">
                      {format(day, 'd')}
                    </div>
                    
                    <div className="space-y-0.5">
                      {dayBookings.slice(0, 2).map(booking => (
                        <div
                          key={booking.id}
                          className={cn(
                            'p-0.5 rounded text-xs truncate',
                            getStatusColor(booking.status)
                          )}
                          title={`${booking.vehicle.model} - ${booking.status}`}
                        >
                          {booking.vehicle.registration_number}
                        </div>
                      ))}
                      
                      {dayBookings.length > 2 && (
                        <div className="text-xs text-gray-500 px-0.5">
                          +{dayBookings.length - 2} plus
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* Vue Timeline */
          <div className="space-y-3 max-h-96 overflow-y-auto">
            <h4 className="font-semibold text-sm mb-3">Réservations planifiées</h4>
            
            {filteredBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucune réservation planifiée
              </p>
            ) : (
              filteredBookings.map(booking => {
                const startDate = new Date(booking.planned_start_date);
                const endDate = new Date(booking.planned_end_date);
                const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <div key={booking.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-sm">
                          {booking.vehicle.model}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {booking.vehicle.registration_number}
                        </div>
                      </div>
                      <Badge variant="outline" className={getStatusColor(booking.status)}>
                        {booking.status === 'pending' ? 'En attente' :
                         booking.status === 'confirmed' ? 'Confirmée' :
                         booking.status === 'cancelled' ? 'Annulée' :
                         booking.status === 'started' ? 'En cours' :
                         booking.status === 'completed' ? 'Terminée' : booking.status}
                      </Badge>
                    </div>
                    
                    <div className="text-xs space-y-1">
                      <div className="text-muted-foreground">
                        📅 {format(startDate, 'dd MMM yyyy', { locale: fr })} à {format(startDate, 'HH:mm')}
                      </div>
                      <div className="text-muted-foreground">
                        📅 {format(endDate, 'dd MMM yyyy', { locale: fr })} à {format(endDate, 'HH:mm')}
                      </div>
                      <div className="text-muted-foreground">
                        ⏱️ {days} jour{days > 1 ? 's' : ''}
                      </div>
                    </div>
                    
                    {booking.user && (
                      <div className="text-xs text-muted-foreground border-t pt-2">
                        👤 {booking.user.name} ({booking.user.email})
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
