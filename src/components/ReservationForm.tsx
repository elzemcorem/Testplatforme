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
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { DateTimePicker } from "./DateTimePicker";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { Reservation } from "../types";
import { reservationService } from "../services/reservationService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

// Options prédéfinies pour les destinations (villes du Bénin)
const BENIN_DESTINATIONS = [
  "Cotonou",
  "Porto-Novo",
  "Calavi",
  "Abomey",
  "Parakou",
  "Bohicon",
  "Ouidah",
  "Allada",
  "Athiémé",
  "Sakété",
  "Agbomey",
  "Ouessé",
];

// Options prédéfinies pour les objets de réservation
const RESERVATION_PURPOSES = [
  "Achat d'articles pétroliers",
  "Livraison de carburant",
  "Inspection de site",
  "Réunion de travail",
  "Transport de personnel",
  "Approvisionnement",
  "Visite d'affaires",
  "Maintenance",
  "Sécurité",
  "Audit",
];

interface ReservationFormProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleName: string;
  vehicleId: string;
}

export function ReservationForm({ isOpen, onClose, vehicleName, vehicleId }: ReservationFormProps) {
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [purpose, setPurpose] = useState("");
  const [needDriver, setNeedDriver] = useState("no");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const { currentUser } = useAuth();

  // Pré-remplir le nom automatiquement quand le dialog s'ouvre
  useEffect(() => {
    if (isOpen && currentUser?.name && !name) {
      setName(currentUser.name);
    }
  }, [isOpen, currentUser, name]);

  const handleSubmit = async () => {
    // Validation simple
    if (!name || !destination || !purpose || !startDate || !endDate) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    // Validation du permis si pas de chauffeur
    if (needDriver === "no" && !currentUser?.hasLicense) {
      toast.error("❌ Vous n'avez pas de permis de conduire. Veuillez sélectionner 'Oui' pour un chauffeur.");
      return;
    }

    if (endDate < startDate) {
      toast.error("La date de fin doit être après la date de début");
      return;
    }

    // Vérifier que l'utilisateur est loggé avec un UUID valide
    if (!currentUser?.id || !currentUser?.email) {
      toast.error("Erreur: Utilisateur non connecté. Veuillez vous reconnecter.");
      return;
    }

    // S'assurer que l'ID est un UUID Supabase valide (36+ caractères)
    if (currentUser.id.length < 36) {
      console.error("❌ Invalid UUID format:", currentUser.id);
      toast.error("Erreur: ID utilisateur invalide. Veuillez vous reconnecter.");
      return;
    }

    // Créer la réservation
    const reservationData: Omit<Reservation, "id" | "createdAt"> = {
      vehicleId,
      vehicleName,
      userName: name,
      userEmail: currentUser.email,
      userId: currentUser.id,
      destination,
      purpose,
      needDriver: needDriver === "yes",
      startDate,
      endDate,
      status: "pending",
    };

    try {
      console.log("🚀 Submitting reservation for:", vehicleName);
      console.log("📋 User ID:", currentUser.id, "- Email:", currentUser.email);
      
      const created = await reservationService.createReservation(reservationData);
      
      if (created) {
        console.log("✅ Reservation created successfully");
        
        // Réinitialiser le formulaire
        setName("");
        setDestination("");
        setPurpose("");
        setNeedDriver("no");
        setStartDate(undefined);
        setEndDate(undefined);

        // Notification de succès
        toast.success(`Votre réservation pour ${vehicleName} a été enregistrée avec succès.`);

        // Fermer le dialog
        onClose();
      } else {
        toast.error("Erreur lors de la création de la réservation");
      }
    } catch (error) {
      console.error("❌ Error creating reservation:", error);
      toast.error("Erreur lors de la création de la réservation");
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
          {/* Nom */}
          <div className="grid gap-2">
            <Label htmlFor="name">
              Nom complet <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Entrez votre nom complet"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Destination */}
          <div className="grid gap-2">
            <Label htmlFor="destination">
              Destination <span className="text-red-500">*</span>
            </Label>
            <Select value={destination} onValueChange={setDestination}>
              <SelectTrigger id="destination" className="w-full">
                <SelectValue placeholder="Sélectionnez une destination" />
              </SelectTrigger>
              <SelectContent>
                {BENIN_DESTINATIONS.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Objet de la réservation */}
          <div className="grid gap-2">
            <Label htmlFor="purpose">
              Objet de la réservation <span className="text-red-500">*</span>
            </Label>
            <Select value={purpose} onValueChange={setPurpose}>
              <SelectTrigger id="purpose" className="w-full">
                <SelectValue placeholder="Sélectionnez un objet" />
              </SelectTrigger>
              <SelectContent>
                {RESERVATION_PURPOSES.map((obj) => (
                  <SelectItem key={obj} value={obj}>
                    {obj}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>
                Date de début <span className="text-red-500">*</span>
              </Label>
              <DateTimePicker
                date={startDate}
                setDate={setStartDate}
                placeholder="Choisir"
              />
            </div>

            <div className="grid gap-2">
              <Label>
                Date de fin <span className="text-red-500">*</span>
              </Label>
              <DateTimePicker
                date={endDate}
                setDate={setEndDate}
                placeholder="Choisir"
              />
            </div>
          </div>

          {/* Besoin d'un chauffeur */}
          <div className="grid gap-2">
            <Label>
              Avez-vous besoin d'un chauffeur ? <span className="text-red-500">*</span>
            </Label>
            <RadioGroup value={needDriver} onValueChange={setNeedDriver}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="yes" />
                <Label htmlFor="yes" className="font-normal cursor-pointer">
                  Oui, j'ai besoin d'un chauffeur
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="no" />
                <Label htmlFor="no" className="font-normal cursor-pointer">
                  Non, je conduirai moi-même
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button className="bg-primary hover:bg-primary/90" onClick={handleSubmit}>
            Confirmer la réservation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}