import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { DateTimePicker } from "./DateTimePicker";
import { toast } from "sonner@2.0.3";
import { useAuth } from "../contexts/AuthContext";
import { futureBookingsService } from "../services/futureBookingsService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { CalendarDays, Clock, AlertCircle } from "lucide-react";
import { format, addDays, addWeeks, addMonths, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";

interface FutureBookingFormProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleName: string;
  vehicleId: string;
  onSuccess?: () => void;
}

type DurationUnit = 'days' | 'weeks' | 'months';

export function FutureBookingForm({ 
  isOpen, 
  onClose, 
  vehicleName, 
  vehicleId,
  onSuccess 
}: FutureBookingFormProps) {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [notes, setNotes] = useState("");
  const [duration, setDuration] = useState<number>(1);
  const [durationUnit, setDurationUnit] = useState<DurationUnit>('days');
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useAuth();

  // Calculer la date de fin basée sur la durée
  useEffect(() => {
    if (!startDate) return;

    let calculatedEndDate = startDate;
    
    if (durationUnit === 'days') {
      calculatedEndDate = addDays(startDate, duration);
    } else if (durationUnit === 'weeks') {
      calculatedEndDate = addWeeks(startDate, duration);
    } else if (durationUnit === 'months') {
      calculatedEndDate = addMonths(startDate, duration);
    }

    setEndDate(calculatedEndDate);
  }, [startDate, duration, durationUnit]);

  const getDurationLabel = (): string => {
    if (durationUnit === 'days') return `${duration} jour${duration > 1 ? 's' : ''}`;
    if (durationUnit === 'weeks') return `${duration} semaine${duration > 1 ? 's' : ''}`;
    return `${duration} mois`;
  };

  const getDayCount = (): number => {
    if (!startDate || !endDate) return 0;
    return differenceInDays(endDate, startDate);
  };

  const handleQuickDuration = (days: number) => {
    if (!startDate) {
      toast.error("Veuillez d'abord sélectionner une date de début");
      return;
    }
    setEndDate(addDays(startDate, days));
    setDuration(days);
    setDurationUnit('days');
  };

  const handleSubmit = async () => {
    if (!startDate || !endDate) {
      toast.error("Veuillez sélectionner les dates de début et fin");
      return;
    }

    if (endDate <= startDate) {
      toast.error("La date de fin doit être après la date de début");
      return;
    }

    if (!currentUser?.id) {
      toast.error("Erreur: Utilisateur non connecté");
      return;
    }

    setIsLoading(true);
    try {
      const result = await futureBookingsService.createFutureBooking({
        user_id: currentUser.id,
        vehicle_id: vehicleId,
        planned_start_date: startDate,
        planned_end_date: endDate,
        notes: notes || undefined
      });

      if (result) {
        toast.success("✅ Réservation future créée avec succès!");
        
        // Réinitialiser le formulaire
        setStartDate(undefined);
        setEndDate(undefined);
        setNotes("");
        setDuration(1);
        setDurationUnit('days');

        if (onSuccess) {
          onSuccess();
        }
        onClose();
      }
    } catch (error) {
      console.error('Error creating future booking:', error);
      toast.error("Erreur lors de la création de la réservation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>🗓️ Réserver {vehicleName} à l'avance</DialogTitle>
          <DialogDescription>
            Réservez ce véhicule pour les jours, semaines ou mois à venir
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date de début */}
          <div className="space-y-2">
            <Label htmlFor="start-date" className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              Date de début
            </Label>
            <DateTimePicker
              value={startDate}
              onChange={setStartDate}
              placeholder="Sélectionner la date de début"
              minDate={new Date()}
            />
          </div>

          {startDate && (
            <>
              {/* Durée rapide */}
              <div className="space-y-2">
                <Label>Durée rapide</Label>
                <div className="grid grid-cols-4 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickDuration(1)}
                    className="text-xs"
                  >
                    1 jour
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickDuration(7)}
                    className="text-xs"
                  >
                    1 semaine
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickDuration(30)}
                    className="text-xs"
                  >
                    1 mois
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickDuration(90)}
                    className="text-xs"
                  >
                    3 mois
                  </Button>
                </div>
              </div>

              {/* Durée personnalisée */}
              <Card className="bg-muted/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Durée personnalisée</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="duration" className="text-xs">Quantité</Label>
                      <Input
                        id="duration"
                        type="number"
                        min={1}
                        max={120}
                        value={duration}
                        onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unit" className="text-xs">Unité</Label>
                      <select
                        id="unit"
                        value={durationUnit}
                        onChange={(e) => setDurationUnit(e.target.value as DurationUnit)}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                      >
                        <option value="days">Jours</option>
                        <option value="weeks">Semaines</option>
                        <option value="months">Mois</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Total</Label>
                      <div className="flex items-center justify-center px-3 py-2 border border-input rounded-md bg-primary/10 font-semibold">
                        {getDayCount()} j
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Affichage des dates */}
              <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                <CardContent className="pt-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Du:</span>
                      <Badge variant="outline" className="font-mono">
                        {format(startDate, "PPP à p", { locale: fr })}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Au:</span>
                      <Badge variant="outline" className="font-mono">
                        {endDate && format(endDate, "PPP à p", { locale: fr })}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="font-semibold">Durée:</span>
                      <span className="font-semibold text-green-700 dark:text-green-400">
                        {getDurationLabel()} ({getDayCount()} jours)
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes optionnelles */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optionnel)</Label>
                <Textarea
                  id="notes"
                  placeholder="Ex: Nécessaire pour une inspection de site..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="resize-none h-20"
                />
              </div>

              {/* Info utilisateur */}
              <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                <CardContent className="pt-4">
                  <div className="flex gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-muted-foreground">
                      <p className="font-semibold text-blue-700 dark:text-blue-400">ℹ️ À savoir</p>
                      <p className="mt-1">
                        Cette réservation sera validée automatiquement. Le véhicule reste disponible pour d'autres réservations jusqu'à la date de début.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!startDate || !endDate || isLoading}
            className="gap-2"
          >
            {isLoading ? "Réservation en cours..." : "Réserver"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
