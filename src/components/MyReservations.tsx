import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Calendar, MapPin, FileText, Car, User, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner@2.0.3";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";

interface Reservation {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  vehicleId: string;
  vehicleName: string;
  destination: string;
  purpose: string;
  needDriver: boolean;
  startDate: Date;
  endDate: Date;
  status: "pending" | "validated" | "cancelled" | "completed";
  cancelReason?: string;
  cancelledBy?: string;
  createdAt?: Date;
}

export function MyReservations() {
  const { currentUser } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    loadReservations();
    const interval = setInterval(loadReservations, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadReservations = () => {
    const stored = localStorage.getItem("reservations");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const reservationsWithDates = parsed.map((res: any) => {
          // Valider et convertir la date
          let validStartDate: Date;
          let validEndDate: Date;
          try {
            validStartDate = new Date(res.startDate);
            validEndDate = new Date(res.endDate);
            // Vérifier si la date est valide
            if (isNaN(validStartDate.getTime()) || isNaN(validEndDate.getTime())) {
              validStartDate = new Date(); // Utiliser la date actuelle si invalide
              validEndDate = new Date(); // Utiliser la date actuelle si invalide
            }
          } catch {
            validStartDate = new Date(); // Utiliser la date actuelle si erreur
            validEndDate = new Date(); // Utiliser la date actuelle si erreur
          }
          
          return {
            ...res,
            startDate: validStartDate,
            endDate: validEndDate,
          };
        });
        // Filtrer uniquement les réservations de l'utilisateur actuel
        const myReservations = reservationsWithDates.filter(
          (res: Reservation) => res.userId === currentUser?.id
        );
        setReservations(myReservations);
      } catch (error) {
        console.error("Error loading reservations:", error);
      }
    }
  };

  const handleCancelClick = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowCancelDialog(true);
  };

  const handleCancelConfirm = () => {
    if (!cancelReason.trim()) {
      toast.error("Veuillez indiquer la raison de l'annulation");
      return;
    }

    if (selectedReservation) {
      // Charger toutes les réservations
      const stored = localStorage.getItem("reservations");
      if (stored) {
        const allReservations = JSON.parse(stored);
        const updated = allReservations.map((res: any) =>
          res.id === selectedReservation.id
            ? {
                ...res,
                status: "cancelled",
                cancelReason,
                cancelledBy: currentUser?.name,
              }
            : res
        );
        localStorage.setItem("reservations", JSON.stringify(updated));
        toast.success("Réservation annulée avec succès");
        loadReservations();
      }
    }

    setShowCancelDialog(false);
    setCancelReason("");
    setSelectedReservation(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500">En attente</Badge>;
      case "validated":
        return <Badge className="bg-green-500">Validée</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500">Annulée</Badge>;
      case "completed":
        return <Badge className="bg-blue-500">Terminée</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const pendingReservations = reservations.filter(r => r.status === "pending");
  const validatedReservations = reservations.filter(r => r.status === "validated");
  const completedReservations = reservations.filter(r => r.status === "completed");
  const cancelledReservations = reservations.filter(r => r.status === "cancelled");

  return (
    <div className="p-6 space-y-6 bg-background min-h-full">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Mes Réservations</h1>
        <p className="text-muted-foreground mt-1">
          Consultez l'état de toutes vos réservations
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-2 border-yellow-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-500">{pendingReservations.length}</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Validées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-500">{validatedReservations.length}</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Terminées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-500">{completedReservations.length}</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Annulées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-500">{cancelledReservations.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Réservations validées (actives) */}
      {validatedReservations.length > 0 && (
        <Card className="border-2 border-green-500/40 bg-green-50 dark:bg-green-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle2 className="w-5 h-5" />
              Réservations Actives - Véhicule Prêt
            </CardTitle>
            <p className="text-sm text-green-600 dark:text-green-500">
              Vous pouvez récupérer votre véhicule
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {validatedReservations.map((reservation) => (
                <Card key={reservation.id} className="border-2 border-green-500/30 bg-white dark:bg-gray-900">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                          <Car className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg">{reservation.vehicleName}</p>
                          {getStatusBadge(reservation.status)}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{reservation.destination}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <FileText className="w-4 h-4" />
                        <span>{reservation.purpose}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="w-4 h-4" />
                        <span>
                          {reservation.needDriver ? "Avec chauffeur" : "Sans chauffeur"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{format(reservation.startDate, "PPP à p", { locale: fr })}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        onClick={() => handleCancelClick(reservation)}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Annuler cette réservation
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Réservations en attente */}
      {pendingReservations.length > 0 && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              Réservations en Attente de Validation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingReservations.map((reservation) => (
                <Card key={reservation.id} className="border-2 border-yellow-500/20">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                          <Car className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg">{reservation.vehicleName}</p>
                          {getStatusBadge(reservation.status)}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{reservation.destination}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <FileText className="w-4 h-4" />
                        <span>{reservation.purpose}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="w-4 h-4" />
                        <span>
                          {reservation.needDriver ? "Avec chauffeur" : "Sans chauffeur"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{format(reservation.startDate, "PPP à p", { locale: fr })}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Réservations terminées */}
      {completedReservations.length > 0 && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-500" />
              Réservations Terminées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedReservations.map((reservation) => (
                <Card key={reservation.id} className="border-2 border-blue-500/20">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                          <Car className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg">{reservation.vehicleName}</p>
                          {getStatusBadge(reservation.status)}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{reservation.destination}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <FileText className="w-4 h-4" />
                        <span>{reservation.purpose}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{format(reservation.startDate, "PPP à p", { locale: fr })}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Réservations annulées */}
      {cancelledReservations.length > 0 && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-red-500" />
              Réservations Annulées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cancelledReservations.map((reservation) => (
                <Card key={reservation.id} className="border-2 border-red-500/20 opacity-70">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                          <Car className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg">{reservation.vehicleName}</p>
                          {getStatusBadge(reservation.status)}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{reservation.destination}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{format(reservation.startDate, "PPP à p", { locale: fr })}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aucune réservation */}
      {reservations.length === 0 && (
        <Card className="border-2 border-primary/20">
          <CardContent className="p-12 text-center">
            <Car className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Aucune réservation</h3>
            <p className="text-muted-foreground">
              Vous n'avez pas encore effectué de réservation. Allez dans le Dashboard pour réserver un véhicule.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialog d'annulation */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Annuler la réservation</DialogTitle>
            <DialogDescription>
              Veuillez indiquer la raison de l'annulation de cette réservation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Label htmlFor="reason">Raison de l'annulation</Label>
            <Textarea
              id="reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Exemple: J'ai besoin d'un autre véhicule"
              className="h-20"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
            >
              Annuler
            </Button>
            <Button type="button" onClick={handleCancelConfirm}>
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
