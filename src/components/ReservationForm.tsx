import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { DateTimePicker } from './DateTimePicker';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { vehiclesApi, reservationsApi, notificationsApi, profilesApi } from '../lib/supabase';

interface ReservationFormProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleName: string;
  vehicleId: string;
}

export function ReservationForm({
  isOpen,
  onClose,
  vehicleName,
  vehicleId,
}: ReservationFormProps) {
  const [destination, setDestination] = useState('');
  const [purpose, setPurpose] = useState('');
  const [needDriver, setNeedDriver] = useState('no');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [submitting, setSubmitting] = useState(false);
  const { currentUser } = useAuth();

  const resetForm = () => {
    setDestination('');
    setPurpose('');
    setNeedDriver('no');
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const handleSubmit = async () => {
    // — Validation
    if (!destination || !purpose || !startDate || !endDate) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    if (endDate <= startDate) {
      toast.error('La date de fin doit être après la date de début');
      return;
    }
    if (!currentUser) {
      toast.error('Vous devez être connecté pour réserver');
      return;
    }

    setSubmitting(true);
    try {
      const startISO = startDate.toISOString();
      const endISO   = endDate.toISOString();

      // 1️⃣ Vérifier les conflits via RPC Supabase
      const { data: available, error: availErr } = await vehiclesApi.getAvailable(startISO, endISO);
      if (availErr) {
        toast.error('Impossible de vérifier la disponibilité. Réessayez.');
        return;
      }
      const isAvailable = (available ?? []).some((v) => v.id === vehicleId);
      if (!isAvailable) {
        toast.error('Ce véhicule est déjà réservé pour ces dates. Choisissez d\'autres dates.');
        return;
      }

      // 2️⃣ Créer la réservation dans Supabase
      const { data: reservation, error: resErr } = await reservationsApi.create({
        user_id:     currentUser.id,
        vehicle_id:  vehicleId,
        destination,
        purpose,
        need_driver: needDriver === 'yes',
        start_date:  startISO,
        end_date:    endISO,
      });

      if (resErr || !reservation) {
        toast.error('Erreur lors de la création de la réservation');
        return;
      }

      // 3️⃣ Notifier tous les admins et controllers
      const { data: admins } = await profilesApi.getAll();
      const responsables = (admins ?? []).filter(
        (p) => p.role === 'admin' || p.role === 'controller'
      );
      await Promise.all(
        responsables.map((r) =>
          notificationsApi.create({
            user_id:        r.id,
            type:           'new_reservation',
            title:          'Nouvelle demande de réservation',
            message:        `${currentUser.name} demande le véhicule ${vehicleName} du ${startDate.toLocaleDateString('fr-FR')} au ${endDate.toLocaleDateString('fr-FR')}`,
            reservation_id: reservation.id,
          })
        )
      );

      toast.success(`Réservation pour ${vehicleName} envoyée avec succès !`);
      resetForm();
      onClose();
    } catch (err) {
      console.error('Reservation error:', err);
      toast.error('Une erreur inattendue est survenue');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Formulaire de réservation</DialogTitle>
          <DialogDescription>
            Réservez le véhicule : <strong>{vehicleName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Destination */}
          <div className="grid gap-2">
            <Label htmlFor="destination">
              Destination <span className="text-red-500">*</span>
            </Label>
            <Input
              id="destination"
              placeholder="Où allez-vous ?"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </div>

          {/* Objet */}
          <div className="grid gap-2">
            <Label htmlFor="purpose">
              Objet de la réservation <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="purpose"
              placeholder="Expliquez le but de votre réservation"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              rows={3}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>
                Date de début <span className="text-red-500">*</span>
              </Label>
              <DateTimePicker date={startDate} setDate={setStartDate} placeholder="Choisir" />
            </div>
            <div className="grid gap-2">
              <Label>
                Date de fin <span className="text-red-500">*</span>
              </Label>
              <DateTimePicker date={endDate} setDate={setEndDate} placeholder="Choisir" />
            </div>
          </div>

          {/* Chauffeur */}
          <div className="grid gap-2">
            <Label>Avez-vous besoin d'un chauffeur ? <span className="text-red-500">*</span></Label>
            <RadioGroup value={needDriver} onValueChange={setNeedDriver}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="driver-yes" />
                <Label htmlFor="driver-yes" className="font-normal cursor-pointer">
                  Oui, j'ai besoin d'un chauffeur
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="driver-no" />
                <Label htmlFor="driver-no" className="font-normal cursor-pointer">
                  Non, je conduirai moi-même
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Annuler
          </Button>
          <Button
            className="bg-primary hover:bg-primary/90"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Envoi en cours…' : 'Confirmer la réservation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
