import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Calendar, MapPin, FileText, User, CheckCircle, XCircle, Clock } from "lucide-react";
import { Reservation } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner@2.0.3";

export function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const { currentUser } = useAuth();

  // Charger les réservations depuis localStorage
  useEffect(() => {
    loadReservations();
    
    // Écouter les changements dans localStorage
    const handleStorageChange = () => {
      loadReservations();
    };
    
    window.addEventListener("storage", handleStorageChange);
    // Polling toutes les 2 secondes pour simuler le temps réel
    const interval = setInterval(loadReservations, 2000);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const loadReservations = () => {
    const stored = localStorage.getItem("reservations");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Convertir les dates string en Date objects
        const reservationsWithDates = parsed.map((res: any) => ({
          ...res,
          startDate: new Date(res.startDate),
          endDate: new Date(res.endDate),
          createdAt: new Date(res.createdAt),
        }));
        setReservations(reservationsWithDates);
      } catch (error) {
        console.error("Error loading reservations:", error);
      }
    }
  };

  const handleValidate = (reservation: Reservation) => {
    // Vérifier que l'utilisateur est un contrôleur
    if (currentUser?.role !== "controller") {
      toast.error("Accès refusé", {
        description: "Seul un contrôleur peut valider les réservations.",
      });
      return;
    }
    
    const updated = reservations.map((res) =>
      res.id === reservation.id
        ? { ...res, status: "validated" as const, validatedBy: currentUser?.name }
        : res
    );
    setReservations(updated);
    localStorage.setItem("reservations", JSON.stringify(updated));
    toast.success("Réservation validée", {
      description: `La réservation de ${reservation.userName} a été validée.`,
    });
    setSelectedReservation(null);
  };

  const handleCancelClick = (reservation: Reservation) => {
    // Vérifier que l'utilisateur est un contrôleur
    if (currentUser?.role !== "controller") {
      toast.error("Accès refusé", {
        description: "Seul un contrôleur peut annuler les réservations.",
      });
      return;
    }
    
    setSelectedReservation(reservation);
    setShowCancelDialog(true);
  };

  const handleCancelConfirm = () => {
    if (!cancelReason.trim()) {
      toast.error("Erreur", {
        description: "Veuillez indiquer la raison de l'annulation",
      });
      return;
    }

    if (selectedReservation) {
      const updated = reservations.map((res) =>
        res.id === selectedReservation.id
          ? {
              ...res,
              status: "cancelled" as const,
              cancelReason,
              cancelledBy: currentUser?.name,
            }
          : res
      );
      setReservations(updated);
      localStorage.setItem("reservations", JSON.stringify(updated));
      toast.success("Réservation annulée", {
        description: `La réservation de ${selectedReservation.userName} a été annulée.`,
      });
    }

    setShowCancelDialog(false);
    setCancelReason("");
    setSelectedReservation(null);
  };

  const handleComplete = (reservation: Reservation) => {
    // Vérifier que l'utilisateur est un contrôleur
    if (currentUser?.role !== "controller") {
      toast.error("Accès refusé", {
        description: "Seul un contrôleur peut marquer une réservation comme terminée.",
      });
      return;
    }
    
    const updated = reservations.map((res) =>
      res.id === reservation.id
        ? { ...res, status: "completed" as const, completedBy: currentUser?.name }
        : res
    );
    setReservations(updated);
    localStorage.setItem("reservations", JSON.stringify(updated));
    toast.success("Réservation terminée", {
      description: `La course de ${reservation.userName} a été marquée comme terminée.`,
    });
  };

  const getStatusBadge = (status: Reservation["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" />En attente</Badge>;
      case "validated":
        return <Badge className="bg-green-500 hover:bg-green-600 gap-1"><CheckCircle className="w-3 h-3" />Validée</Badge>;
      case "cancelled":
        return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" />Annulée</Badge>;
      case "completed":
        return <Badge className="bg-blue-500 hover:bg-blue-600 gap-1"><CheckCircle className="w-3 h-3" />Terminée</Badge>;
    }
  };

  const pendingReservations = reservations.filter((r) => r.status === "pending");
  const validatedReservations = reservations.filter((r) => r.status === "validated");
  const cancelledReservations = reservations.filter((r) => r.status === "cancelled");
  const completedReservations = reservations.filter((r) => r.status === "completed");

  return (
    <div className="p-6 space-y-6 bg-background min-h-full">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Réservations</h1>
        <p className="text-muted-foreground mt-1">
          {currentUser?.role === "controller" 
            ? "Gérez toutes les réservations de véhicules" 
            : "Consultez toutes les réservations de véhicules"}
        </p>
        {currentUser?.role === "admin" && (
          <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
            <p className="text-sm text-blue-700 dark:text-blue-400">
              ℹ️ En tant qu'admin, vous pouvez consulter les réservations, mais seul un contrôleur peut les valider ou les annuler.
            </p>
          </div>
        )}
        {currentUser?.role === "user" && (
          <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
            <p className="text-sm text-blue-700 dark:text-blue-400">
              ℹ️ Vous pouvez consulter toutes les réservations. Seul un contrôleur peut les valider ou les annuler.
            </p>
          </div>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-2 border-orange-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-500">{pendingReservations.length}</p>
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
      </div>

      {/* Liste des réservations */}
      <div className="space-y-4">
        {reservations.length === 0 ? (
          <Card className="border-2 border-primary/20">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Aucune réservation pour le moment</p>
            </CardContent>
          </Card>
        ) : (
          reservations
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .map((reservation) => (
              <Card
                key={reservation.id}
                className="border-2 border-primary/20 hover:border-primary/40 transition-colors cursor-pointer"
                onClick={() => setSelectedReservation(reservation)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {reservation.vehicleName}
                        {getStatusBadge(reservation.status)}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {reservation.userName} ({reservation.userEmail})
                      </CardDescription>
                    </div>
                    {reservation.status === "pending" && currentUser?.role === "controller" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleValidate(reservation);
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Valider
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelClick(reservation);
                          }}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Annuler
                        </Button>
                      </div>
                    )}
                    {reservation.status === "validated" && currentUser?.role === "controller" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleComplete(reservation);
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Terminé
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-0.5 text-primary" />
                      <div>
                        <p className="font-medium">Destination</p>
                        <p className="text-muted-foreground">{reservation.destination}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 mt-0.5 text-primary" />
                      <div>
                        <p className="font-medium">Période</p>
                        <p className="text-muted-foreground">
                          {format(reservation.startDate, "PPP", { locale: fr })} -{" "}
                          {format(reservation.endDate, "PPP", { locale: fr })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 md:col-span-2">
                      <FileText className="w-4 h-4 mt-0.5 text-primary" />
                      <div>
                        <p className="font-medium">Objet</p>
                        <p className="text-muted-foreground">{reservation.purpose}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={reservation.needDriver ? "default" : "secondary"}>
                        {reservation.needDriver ? "Avec chauffeur" : "Sans chauffeur"}
                      </Badge>
                    </div>

                    {reservation.status === "cancelled" && reservation.cancelReason && (
                      <div className="md:col-span-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
                        <p className="font-medium text-red-700 dark:text-red-400 mb-1">
                          Raison de l'annulation :
                        </p>
                        <p className="text-sm text-red-600 dark:text-red-300">
                          {reservation.cancelReason}
                        </p>
                        {reservation.cancelledBy && (
                          <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                            Annulée par {reservation.cancelledBy}
                          </p>
                        )}
                      </div>
                    )}

                    {reservation.status === "validated" && reservation.validatedBy && (
                      <div className="md:col-span-2">
                        <p className="text-xs text-green-600 dark:text-green-400">
                          Validée par {reservation.validatedBy}
                        </p>
                      </div>
                    )}

                    {reservation.status === "completed" && reservation.completedBy && (
                      <div className="md:col-span-2">
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          Terminée par {reservation.completedBy}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
        )}
      </div>

      {/* Dialog d'annulation */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Annuler la réservation</DialogTitle>
            <DialogDescription>
              Veuillez indiquer la raison de l'annulation de cette réservation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="cancelReason">Raison de l'annulation *</Label>
            <Textarea
              id="cancelReason"
              placeholder="Expliquez pourquoi cette réservation est annulée..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelDialog(false);
                setCancelReason("");
                setSelectedReservation(null);
              }}
            >
              Retour
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelConfirm}
            >
              Confirmer l'annulation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}