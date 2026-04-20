import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Calendar, Download, FileText, Filter, LogOut, Eye } from "lucide-react";
import { toast } from "sonner";
import { format, isAfter, isBefore, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "../utils/supabase/client";
import { SatisfactionTable } from "./SatisfactionTable";
import { useAuth } from "../contexts/AuthContext";

interface ExitReport {
  id: string;
  vehicleName: string;
  vehicleId: string;
  userId: string;
  userName: string;
  userEmail: string;
  departureDate: Date;
  expectedReturnDate: Date;
  odometerStart?: number;
  fuelLevelStart?: string;
  vehicleCondition?: string;
  vehicleConditionNotes?: string;
  itemsChecklist?: any[];
  fuelProvidedLiters?: number;
  inspectorName: string;
  globalNotes?: string;
}

export function ExitReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<ExitReport[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportData, setReportData] = useState<ExitReport[]>([]);
  const [reportDate, setReportDate] = useState("");
  const [satisfactionTableKey, setSatisfactionTableKey] = useState(0);
  const [tempSatisfactionId] = useState(() => crypto.randomUUID());

  useEffect(() => {
    loadExitReports();
    const interval = setInterval(loadExitReports, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadExitReports = async () => {
    try {
      const { data, error } = await supabase
        .from("exit_reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Erreur chargement rapports de sortie:", error);
        return;
      }

      const mapped = (data || []).map((report: any) => ({
        id: report.id,
        vehicleName: report.vehicle_name,
        vehicleId: report.vehicle_id,
        userId: report.user_id,
        userName: report.user_name,
        userEmail: report.user_email,
        departureDate: new Date(report.departure_date),
        expectedReturnDate: new Date(report.expected_return_date),
        odometerStart: report.odometer_reading_start,
        fuelLevelStart: report.fuel_level_start,
        vehicleCondition: report.vehicle_condition,
        vehicleConditionNotes: report.vehicle_condition_notes,
        itemsChecklist: report.items_checklist || [],
        fuelProvidedLiters: report.fuel_provided_liters,
        inspectorName: report.inspector_name || "Non renseigné",
        globalNotes: report.global_notes,
      }));

      setReports(mapped);
      console.log(`✅ ${mapped.length} rapports de sortie chargés`);
    } catch (error) {
      console.error("❌ Exception chargement rapports:", error);
    }
  };

  const handleGenerateReport = () => {
    if (!selectedDate) {
      toast.error("Veuillez sélectionner une date");
      return;
    }

    const targetDate = new Date(selectedDate);
    const filteredReports = reports.filter((report) =>
      isSameDay(report.departureDate, targetDate)
    );

    if (filteredReports.length === 0) {
      toast.error("Aucun rapport de sortie trouvé pour cette date");
      return;
    }

    setReportData(filteredReports);
    setReportDate(format(targetDate, "PPP", { locale: fr }));
    setShowReportDialog(true);
  };

  const generatePDFReport = () => {
    let reportContent = `RAPPORT DE SORTIES VÉHICULES\n`;
    reportContent += `Date: ${reportDate}\n`;
    reportContent += `Généré le: ${format(new Date(), "PPP à p", { locale: fr })}\n`;
    reportContent += `\n${"=".repeat(80)}\n\n`;

    reportData.forEach((report, index) => {
      reportContent += `SORTIE ${index + 1}/${reportData.length}\n`;
      reportContent += `${"-".repeat(80)}\n`;
      reportContent += `Véhicule: ${report.vehicleName}\n`;
      reportContent += `Utilisateur: ${report.userName} (${report.userEmail})\n`;
      reportContent += `Date de sortie: ${format(report.departureDate, "PPP à p", { locale: fr })}\n`;
      reportContent += `Retour attendu: ${format(report.expectedReturnDate, "PPP à p", { locale: fr })}\n`;
      reportContent += `Inspecteur: ${report.inspectorName}\n\n`;

      reportContent += `ÉTAT À LA SORTIE:\n`;
      reportContent += `  Kilométrage: ${report.odometerStart || "Non renseigné"} km\n`;
      reportContent += `  Niveau carburant: ${report.fuelLevelStart || "Non renseigné"}\n`;
      reportContent += `  État général: ${report.vehicleCondition || "Non renseigné"}\n`;
      if (report.vehicleConditionNotes) {
        reportContent += `  Notes: ${report.vehicleConditionNotes}\n`;
      }
      reportContent += `  Carburant fourni: ${report.fuelProvidedLiters || 0} litres\n\n`;

      if (report.itemsChecklist && report.itemsChecklist.length > 0) {
        reportContent += `VÉRIFICATION ÉLÉMENTS:\n`;
        report.itemsChecklist.forEach((item: any) => {
          const statusSymbol = item.status === "ok" ? "✓" : "!";
          reportContent += `  ${statusSymbol} ${item.name}: ${item.status.toUpperCase()}\n`;
        });
        reportContent += `\n`;
      }

      if (report.globalNotes) {
        reportContent += `NOTES:\n${report.globalNotes}\n`;
      }

      reportContent += `\n${"=".repeat(80)}\n\n`;
    });

    const blob = new Blob([reportContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rapport_sorties_${format(new Date(selectedDate), "yyyy-MM-dd")}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Rapport téléchargé avec succès");
  };

  const generateWordReport = () => {
    let htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Rapport de Sorties Véhicules</title>
  <style>
    body { font-family: 'Calibri', sans-serif; max-width: 900px; margin: 40px auto; padding: 20px; }
    h1 { color: #dc2626; border-bottom: 3px solid #dc2626; padding-bottom: 10px; }
    h2 { color: #b91c1c; margin-top: 30px; border-bottom: 2px solid #fee2e2; padding-bottom: 8px; }
    h3 { color: #991b1b; margin-top: 15px; }
    .meta { color: #666; font-size: 14px; margin-bottom: 20px; }
    .info { background: #fef2f2; padding: 15px; border-radius: 8px; margin: 15px 0; }
    .info-item { margin: 8px 0; }
    .ok { color: #16a34a; }
    .defect { color: #ef4444; }
    .item { margin: 8px 0; padding: 8px; background: #f9fafb; border-left: 3px solid #fecaca; }
    .notes { font-style: italic; color: #666; margin-top: 10px; }
    .separator { margin: 40px 0; border-top: 2px solid #e5e7eb; }
  </style>
</head>
<body>
  <h1>🚗 RAPPORT DE SORTIES VÉHICULES</h1>
  <div class="meta">
    <p><strong>Date:</strong> ${reportDate}</p>
    <p><strong>Généré le:</strong> ${format(new Date(), "PPP à p", { locale: fr })}</p>
    <p><strong>Nombre de sorties:</strong> ${reportData.length}</p>
  </div>
`;

    reportData.forEach((report, index) => {
      htmlContent += `
  ${index > 0 ? '<div class="separator"></div>' : ''}
  <h2>SORTIE ${index + 1}/${reportData.length} - ${report.vehicleName}</h2>
  <div class="info">
    <div class="info-item"><strong>Utilisateur:</strong> ${report.userName} (${report.userEmail})</div>
    <div class="info-item"><strong>Date de sortie:</strong> ${format(report.departureDate, "PPP à p", { locale: fr })}</div>
    <div class="info-item"><strong>Retour attendu:</strong> ${format(report.expectedReturnDate, "PPP à p", { locale: fr })}</div>
    <div class="info-item"><strong>Inspecteur:</strong> ${report.inspectorName}</div>
  </div>
  
  <h3>État à la sortie</h3>
  <div class="info">
    <div class="info-item"><strong>Kilométrage:</strong> ${report.odometerStart || "Non renseigné"} km</div>
    <div class="info-item"><strong>Niveau carburant:</strong> ${report.fuelLevelStart || "Non renseigné"}</div>
    <div class="info-item"><strong>État général:</strong> ${report.vehicleCondition || "Non renseigné"}</div>
    <div class="info-item"><strong>Carburant fourni:</strong> ${report.fuelProvidedLiters || 0} litres</div>
    ${report.vehicleConditionNotes ? `<div class="info-item"><strong>Notes:</strong> ${report.vehicleConditionNotes}</div>` : ""}
  </div>
`;

      if (report.itemsChecklist && report.itemsChecklist.length > 0) {
        htmlContent += `<h3>Vérification des éléments</h3>`;
        report.itemsChecklist.forEach((item: any) => {
          const statusClass = item.status === "ok" ? "ok" : "defect";
          const statusSymbol = item.status === "ok" ? "✓" : "✗";
          htmlContent += `<div class="item"><span class="${statusClass}">${statusSymbol}</span> <strong>${item.name}:</strong> ${item.status.toUpperCase()}</div>`;
        });
      }

      if (report.globalNotes) {
        htmlContent += `<div class="notes"><h3>Notes</h3><p>${report.globalNotes}</p></div>`;
      }
    });

    htmlContent += `</body></html>`;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rapport_sorties_${format(new Date(selectedDate), "yyyy-MM-dd")}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Rapport Word téléchargé avec succès");
  };

  return (
    <div className="space-y-8">
      {/* ============ EN-TÊTE ============ */}
      <div className="flex items-center gap-3 mb-8">
        <LogOut className="w-8 h-8 text-red-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Rapports de Sortie & Satisfaction
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Remplissez le tableau de satisfaction avant de générer votre rapport
          </p>
        </div>
      </div>

      {/* ============ TABLEAU DE SATISFACTION (VISIBLE DIRECTEMENT) ============ */}
      <Card className="border-2 border-blue-500 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <CardTitle className="flex items-center gap-2 text-2xl">
            📊 Tableau de Satisfaction des Services
          </CardTitle>
          <CardDescription className="text-blue-100">
            Remplissez ce formulaire pour documenter la satisfaction des services de votre sortie
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-8">
          <SatisfactionTable
            key={satisfactionTableKey}
            exitReportId={tempSatisfactionId}
            vehicleId=""
            userId={user?.id || ""}
            onSave={async () => {
              toast.success("✅ Rapport de satisfaction enregistré avec succès!");
              setSatisfactionTableKey(k => k + 1); // Réinitialiser le tableau
            }}
          />
        </CardContent>
      </Card>

      {/* ============ GÉNÉRER UN RAPPORT AVEC LES SORTIES ============ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Générer un Rapport de Sorties
          </CardTitle>
          <CardDescription>
            Consultez toutes les sorties d'une journée donnée
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4 flex-col md:flex-row">
              <div className="flex-1">
                <Label htmlFor="report-date">Sélectionner une date</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="report-date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleGenerateReport}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Voir Sorties
                  </Button>
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 pt-2 border-t">
              📌 Total: <strong>{reports.length} sortie(s)</strong> enregistrée(s)
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ============ RÉSUMÉ STATISTIQUES ============ */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Sorties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{reports.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Aujourd'hui</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {reports.filter((r) => isSameDay(r.departureDate, new Date())).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Cette semaine</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {
                reports.filter((r) => {
                  const today = new Date();
                  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                  return r.departureDate >= weekAgo && r.departureDate <= today;
                }).length
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============ DIALOG: VUE DES SORTIES & EXPORTS ============ */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-4xl max-h-96 overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Sorties du {reportDate}
            </DialogTitle>
            <DialogDescription>
              {reportData.length} sortie(s) trouvée(s) | Téléchargez le rapport complet
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-4">
            {reportData.map((report, index) => (
              <div
                key={report.id}
                className="border-l-4 border-blue-500 pl-4 py-3 bg-gray-50 dark:bg-gray-900 rounded"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-bold text-sm">
                      Sortie {index + 1}: {report.vehicleName}
                    </p>
                    <p className="text-xs text-gray-600">
                      🚗 Véhicule: {report.vehicleName} | 👤 Utilisateur: {report.userName}
                    </p>
                    <p className="text-xs text-gray-600">
                      📅 {format(report.departureDate, "dd/MM/yyyy HH:mm", { locale: fr })} → {format(report.expectedReturnDate, "dd/MM/yyyy HH:mm", { locale: fr })}
                    </p>
                    <p className="text-xs text-gray-600">
                      ⛽ Kilométrage: {report.odometerStart || "-"} km | Carburant: {report.fuelLevelStart || "-"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="gap-2 pt-6 border-t">
            <Button variant="outline" onClick={() => setShowReportDialog(false)}>
              Fermer
            </Button>
            <Button onClick={generateWordReport} className="bg-blue-600 hover:bg-blue-700">
              <Download className="w-4 h-4 mr-2" />
              Télécharger Word
            </Button>
            <Button onClick={generatePDFReport} className="bg-red-600 hover:bg-red-700">
              <Download className="w-4 h-4 mr-2" />
              Télécharger PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
