import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { 
  Download, 
  FileText, 
  Calendar as CalendarIcon,
  Filter,
  ChevronDown,
  ChevronUp,
  Printer,
  FileSearch
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "./ui/utils";
import { toast } from "sonner";

interface Reservation {
  id: string;
  vehicleName: string;
  vehicleType: string;
  clientName: string;
  destination: string;
  purpose: string;
  needDriver: boolean;
  startDate: string;
  endDate: string;
  days: number;
  status: "completed" | "active" | "cancelled";
}

export function ReservationReports() {
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [reportType, setReportType] = useState("all");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [reportDate, setReportDate] = useState<Date>();
  const [showGeneratedReport, setShowGeneratedReport] = useState(false);

  // Données simulées de rapports enregistrés par date
  const savedReports: Record<string, Reservation[]> = {
    "2024-04-01": [
      {
        id: "R001",
        vehicleName: "Toyota Corolla",
        vehicleType: "Berline",
        clientName: "Jean Dupont",
        destination: "Cotonou - Porto-Novo",
        purpose: "Mission officielle",
        needDriver: true,
        startDate: "2024-04-01",
        endDate: "2024-04-05",
        days: 4,
        status: "completed",
      },
      {
        id: "R002",
        vehicleName: "Honda CR-V",
        vehicleType: "SUV",
        clientName: "Marie Martin",
        destination: "Parakou",
        purpose: "Déplacement professionnel",
        needDriver: false,
        startDate: "2024-04-01",
        endDate: "2024-04-03",
        days: 2,
        status: "completed",
      },
    ],
    "2024-04-14": [
      {
        id: "R003",
        vehicleName: "Mercedes-Benz Classe E",
        vehicleType: "Luxe",
        clientName: "Paul Bernard",
        destination: "Bohicon",
        purpose: "Réunion importante",
        needDriver: true,
        startDate: "2024-04-14",
        endDate: "2024-04-14",
        days: 1,
        status: "completed",
      },
      {
        id: "R004",
        vehicleName: "Toyota Hiace",
        vehicleType: "Minibus",
        clientName: "Sophie Lefebvre",
        destination: "Abomey-Calavi",
        purpose: "Transport d'équipe",
        needDriver: true,
        startDate: "2024-04-14",
        endDate: "2024-04-16",
        days: 2,
        status: "active",
      },
      {
        id: "R005",
        vehicleName: "Nissan Patrol",
        vehicleType: "SUV",
        clientName: "Luc Moreau",
        destination: "Natitingou",
        purpose: "Visite de terrain",
        needDriver: false,
        startDate: "2024-04-14",
        endDate: "2024-04-18",
        days: 4,
        status: "active",
      },
    ],
  };

  const [displayedReservations, setDisplayedReservations] = useState<Reservation[]>([]);

  const handleGenerateReport = () => {
    if (!reportDate) {
      toast.error("Erreur", {
        description: "Veuillez sélectionner une date pour générer le rapport",
      });
      return;
    }

    const dateKey = format(reportDate, "yyyy-MM-dd");
    const reportData = savedReports[dateKey];

    if (!reportData || reportData.length === 0) {
      toast.error("Rapport introuvable", {
        description: `Aucun rapport trouvé pour la date ${format(reportDate, "PPP", { locale: fr })}`,
      });
      setDisplayedReservations([]);
      setShowGeneratedReport(false);
      return;
    }

    setDisplayedReservations(reportData);
    setShowGeneratedReport(true);
    toast.success("Rapport généré", {
      description: `${reportData.length} réservation(s) trouvée(s) pour cette date`,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500 text-white">Terminée</Badge>;
      case "active":
        return <Badge className="bg-blue-500 text-white">En cours</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500 text-white">Annulée</Badge>;
      default:
        return <Badge>Inconnu</Badge>;
    }
  };

  const completedReservations = displayedReservations.filter(r => r.status === "completed").length;
  const activeReservations = displayedReservations.filter(r => r.status === "active").length;
  const cancelledReservations = displayedReservations.filter(r => r.status === "cancelled").length;

  return (
    <div className="p-6 space-y-6 bg-background min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Rapports</h1>
          <p className="text-muted-foreground mt-1">
            Générez et exportez des rapports détaillés de réservations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Printer className="w-4 h-4" />
            Imprimer
          </Button>
          <Button className="bg-primary hover:bg-primary/90 gap-2">
            <Download className="w-4 h-4" />
            Exporter PDF
          </Button>
        </div>
      </div>

      {/* Générer un rapport par date */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSearch className="w-5 h-5 text-primary" />
            Générer un rapport
          </CardTitle>
          <CardDescription>
            Sélectionnez une date pour générer le rapport enregistré
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label>Date du rapport</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal border-primary/20",
                      !reportDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {reportDate ? format(reportDate, "PPP", { locale: fr }) : "Sélectionner une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={reportDate}
                    onSelect={setReportDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Button 
              className="bg-primary hover:bg-primary/90 gap-2"
              onClick={handleGenerateReport}
            >
              <FileSearch className="w-4 h-4" />
              Générer le rapport
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards - Affiche seulement si un rapport est généré */}
      {showGeneratedReport && displayedReservations.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-2 border-green-500/20">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Terminées</p>
                  <p className="text-3xl font-bold text-green-600">{completedReservations}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-500/20">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">En cours</p>
                  <p className="text-3xl font-bold text-blue-600">{activeReservations}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total réservations</p>
                  <p className="text-3xl font-bold text-primary">{displayedReservations.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reservations Table */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Rapport du {reportDate && format(reportDate, "PPP", { locale: fr })}
              </CardTitle>
              <CardDescription>
                Liste des réservations pour cette date
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">ID</th>
                      <th className="text-left py-3 px-4">Client</th>
                      <th className="text-left py-3 px-4">Véhicule</th>
                      <th className="text-left py-3 px-4">Destination</th>
                      <th className="text-left py-3 px-4">Objet</th>
                      <th className="text-center py-3 px-4">Chauffeur</th>
                      <th className="text-left py-3 px-4">Début</th>
                      <th className="text-left py-3 px-4">Fin</th>
                      <th className="text-center py-3 px-4">Jours</th>
                      <th className="text-center py-3 px-4">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedReservations.map((reservation) => (
                      <tr key={reservation.id} className="border-b hover:bg-accent/50">
                        <td className="py-4 px-4 font-mono text-sm">{reservation.id}</td>
                        <td className="py-4 px-4 font-medium">{reservation.clientName}</td>
                        <td className="py-4 px-4">{reservation.vehicleName}</td>
                        <td className="py-4 px-4">{reservation.destination}</td>
                        <td className="py-4 px-4 max-w-xs truncate" title={reservation.purpose}>
                          {reservation.purpose}
                        </td>
                        <td className="text-center py-4 px-4">
                          {reservation.needDriver ? (
                            <Badge variant="secondary">Oui</Badge>
                          ) : (
                            <Badge variant="outline">Non</Badge>
                          )}
                        </td>
                        <td className="py-4 px-4">{reservation.startDate}</td>
                        <td className="py-4 px-4">{reservation.endDate}</td>
                        <td className="text-center py-4 px-4">{reservation.days}</td>
                        <td className="text-center py-4 px-4">
                          {getStatusBadge(reservation.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Message si aucun rapport */}
      {!showGeneratedReport && (
        <Card className="border-2 border-primary/20">
          <CardContent className="py-12">
            <div className="text-center space-y-3">
              <FileSearch className="w-16 h-16 text-muted-foreground mx-auto" />
              <h3 className="text-xl font-semibold">Aucun rapport généré</h3>
              <p className="text-muted-foreground">
                Sélectionnez une date ci-dessus pour générer un rapport
              </p>
              <p className="text-sm text-muted-foreground">
                Dates disponibles : 1er avril 2024, 14 avril 2024
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}