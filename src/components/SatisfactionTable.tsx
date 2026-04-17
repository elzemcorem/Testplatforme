import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Download, RotateCcw } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { satisfactionReportService, SatisfactionData } from "../services/satisfactionReportService";

interface SatisfactionTableProps {
  exitReportId: string;
  vehicleId: string;
  userId: string;
  onSave?: (data: SatisfactionData) => Promise<void>;
  isReadOnly?: boolean;
}

const SERVICES = ["DCM", "DTM", "DAF", "QHSE", "DO"];

export function SatisfactionTable({
  exitReportId,
  vehicleId,
  userId,
  onSave,
  isReadOnly = false,
}: SatisfactionTableProps) {
  const [data, setData] = useState<SatisfactionData>({
    dcm: { requests: 0, satisfied: 0, unsatisfied: 0 },
    dtm: { requests: 0, satisfied: 0, unsatisfied: 0 },
    daf: { requests: 0, satisfied: 0, unsatisfied: 0 },
    qhse: { requests: 0, satisfied: 0, unsatisfied: 0 },
    do: { requests: 0, satisfied: 0, unsatisfied: 0 },
    notes: "",
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [exitReportId]);

  const loadData = async () => {
    const report = await satisfactionReportService.loadSatisfactionReport(exitReportId);
    if (report) {
      setData({
        dcm: report.dcm,
        dtm: report.dtm,
        daf: report.daf,
        qhse: report.qhse,
        do: report.do,
        notes: report.notes || "",
      });
    }
  };

  const handleInputChange = (service: keyof typeof data, field: string, value: number) => {
    if (isReadOnly) return;

    setData((prev) => {
      if (service === "notes") {
        return { ...prev, notes: value as any };
      }
      return {
        ...prev,
        [service]: {
          ...(prev[service] as any),
          [field]: value,
        },
      };
    });
  };

  const handleSave = async () => {
    if (isReadOnly) return;

    setIsSaving(true);
    try {
      const success = await satisfactionReportService.createSatisfactionReport(
        exitReportId,
        vehicleId,
        userId,
        data,
        userId
      );

      if (success) {
        toast.success("✅ Données de satisfaction enregistrées");
        if (onSave) await onSave(data);
        // Réinitialiser le formulaire
        setData({
          dcm: { requests: 0, satisfied: 0, unsatisfied: 0 },
          dtm: { requests: 0, satisfied: 0, unsatisfied: 0 },
          daf: { requests: 0, satisfied: 0, unsatisfied: 0 },
          qhse: { requests: 0, satisfied: 0, unsatisfied: 0 },
          do: { requests: 0, satisfied: 0, unsatisfied: 0 },
          notes: "",
        });
      } else {
        toast.error("❌ Erreur lors de l'enregistrement");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (isReadOnly) return;
    setData({
      dcm: { requests: 0, satisfied: 0, unsatisfied: 0 },
      dtm: { requests: 0, satisfied: 0, unsatisfied: 0 },
      daf: { requests: 0, satisfied: 0, unsatisfied: 0 },
      qhse: { requests: 0, satisfied: 0, unsatisfied: 0 },
      do: { requests: 0, satisfied: 0, unsatisfied: 0 },
      notes: "",
    });
  };

  const exportToExcel = () => {
    const totals = satisfactionReportService.calculateTotals(data);
    const dateStr = new Date().toLocaleDateString("fr-FR");

    // En-tête
    let csv = "RAPPORT DE SATISFACTION DES SERVICES\n";
    csv += `Généré le,${dateStr}\n\n`;
    csv += "SERVICES,NOMBRE DEMANDES,NOMBRES SATISFAIT,NOMBRE NON SATISFAITS,TAUX SATISFACTION (%),TAUX NON SATISFACTION (%)\n";

    SERVICES.forEach((service) => {
      const serviceKey = service.toLowerCase() as keyof typeof data;
      const serviceData = data[serviceKey] as any;
      const rates = satisfactionReportService.calculateRates(serviceData);

      csv += `${service},${serviceData.requests},${serviceData.satisfied},${serviceData.unsatisfied},${rates.satisfaction},${rates.dissatisfaction}\n`;
    });

    // TOTAL
    const totalRates = satisfactionReportService.calculateRates(totals);
    csv += `TOTAL,${totals.requests},${totals.satisfied},${totals.unsatisfied},${totalRates.satisfaction},${totalRates.dissatisfaction}\n`;

    if (data.notes) {
      csv += `\n\nNOTES ADDITIONNELLES\n"${data.notes}"`;
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `satisfaction_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("📊 Export Excel (CSV) téléchargé");
  };

  const exportToPDF = () => {
    const totals = satisfactionReportService.calculateTotals(data);
    const dateStr = new Date().toLocaleDateString("fr-FR");
    const timeStr = new Date().toLocaleTimeString("fr-FR");

    let htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport de Satisfaction - ${dateStr}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: white;
      color: #333;
      line-height: 1.6;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #1e40af;
      font-size: 28px;
      margin-bottom: 10px;
    }
    .header p {
      color: #666;
      font-size: 14px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
      font-size: 12px;
      color: #666;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    th {
      background: #2563eb;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      border: 1px solid #1e40af;
      font-size: 12px;
    }
    td {
      padding: 12px;
      border: 1px solid #ddd;
      text-align: center;
      font-size: 12px;
    }
    tr:nth-child(even) {
      background-color: #f9fafb;
    }
    tr:hover {
      background-color: #f3f4f6;
    }
    .total-row {
      background-color: #eff6ff;
      font-weight: bold;
      border-top: 2px solid #2563eb;
    }
    .total-row td {
      background-color: #dbeafe;
      color: #1e40af;
    }
    .satisfaction-high {
      color: #16a34a;
      font-weight: 600;
    }
    .satisfaction-low {
      color: #dc2626;
      font-weight: 600;
    }
    .notes-section {
      background: #f0f9ff;
      border-left: 4px solid #2563eb;
      padding: 15px;
      margin-top: 20px;
      border-radius: 4px;
    }
    .notes-section h3 {
      color: #1e40af;
      margin-bottom: 10px;
      font-size: 14px;
    }
    .notes-section p {
      color: #475569;
      font-size: 12px;
      line-height: 1.5;
      word-wrap: break-word;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      color: #999;
      font-size: 10px;
      border-top: 1px solid #ddd;
      padding-top: 20px;
    }
    @media print {
      body { background: white; }
      .container { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 RAPPORT DE SATISFACTION</h1>
      <p>Rapport de satisfaction des services - Qualité et efficacité</p>
    </div>

    <div class="info-row">
      <div><strong>Date:</strong> ${dateStr}</div>
      <div><strong>Heure:</strong> ${timeStr}</div>
    </div>

    <table>
      <thead>
        <tr>
          <th>SERVICES</th>
          <th>DEMANDES</th>
          <th>SATISFAITS</th>
          <th>NON SATISFAITS</th>
          <th>TAUX SATISFACTION</th>
          <th>TAUX INSATISFACTION</th>
        </tr>
      </thead>
      <tbody>`;

    SERVICES.forEach((service) => {
      const serviceKey = service.toLowerCase() as keyof typeof data;
      const serviceData = data[serviceKey] as any;
      const rates = satisfactionReportService.calculateRates(serviceData);
      const satClass = rates.satisfaction >= 80 ? "satisfaction-high" : "satisfaction-low";

      htmlContent += `
        <tr>
          <td><strong>${service}</strong></td>
          <td>${serviceData.requests}</td>
          <td>${serviceData.satisfied}</td>
          <td>${serviceData.unsatisfied}</td>
          <td class="${satClass}">${rates.satisfaction}%</td>
          <td class="satisfaction-low">${rates.dissatisfaction}%</td>
        </tr>`;
    });

    const totalRates = satisfactionReportService.calculateRates(totals);
    const totalSatClass = totalRates.satisfaction >= 80 ? "satisfaction-high" : "satisfaction-low";

    htmlContent += `
        <tr class="total-row">
          <td>TOTAL GLOBAL</td>
          <td>${totals.requests}</td>
          <td>${totals.satisfied}</td>
          <td>${totals.unsatisfied}</td>
          <td class="${totalSatClass}">${totalRates.satisfaction}%</td>
          <td>${totalRates.dissatisfaction}%</td>
        </tr>
      </tbody>
    </table>`;

    if (data.notes && data.notes.trim()) {
      htmlContent += `
    <div class="notes-section">
      <h3>📝 NOTES ET OBSERVATIONS</h3>
      <p>${data.notes.replace(/\n/g, "<br>")}</p>
    </div>`;
    }

    htmlContent += `
    <div class="footer">
      <p>Document généré automatiquement le ${dateStr} à ${timeStr}</p>
      <p>© 2026 Système de Gestion de la Flotte Véhiculaire</p>
    </div>
  </div>
</body>
</html>`;

    // Créer et télécharger le PDF
    const blob = new Blob([htmlContent], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `satisfaction_${new Date().toISOString().split("T")[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("📄 Export PDF téléchargé");
  };

  const exportToWord = () => {
    const totals = satisfactionReportService.calculateTotals(data);
    const dateStr = new Date().toLocaleDateString("fr-FR");
    const timeStr = new Date().toLocaleTimeString("fr-FR");

    let htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport de Satisfaction - ${dateStr}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Calibri', 'Segoe UI', sans-serif;
      background: white;
      color: #333;
      line-height: 1.6;
      padding: 40px;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #d32f2f;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #b71c1c;
      font-size: 32px;
      margin-bottom: 10px;
      font-weight: bold;
    }
    .header p {
      color: #666;
      font-size: 14px;
    }
    .metadata {
      background: #fafafa;
      padding: 15px;
      margin-bottom: 30px;
      border-radius: 4px;
      font-size: 12px;
    }
    .metadata-row {
      margin: 5px 0;
    }
    .metadata-label {
      font-weight: bold;
      color: #555;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-family: Calibri, sans-serif;
    }
    th {
      background: #c62828;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: bold;
      border: 1px solid #b71c1c;
      font-size: 12px;
    }
    td {
      padding: 10px 12px;
      border: 1px solid #ddd;
      text-align: center;
      font-size: 11px;
    }
    tr:nth-child(even) {
      background-color: #f5f5f5;
    }
    .total-row {
      background-color: #fde4e4;
      font-weight: bold;
      border-top: 2px solid #d32f2f;
    }
    .total-row td {
      background-color: #f3e5e5;
      color: #b71c1c;
      font-weight: bold;
    }
    .satisfaction {
      color: #2e7d32;
      font-weight: bold;
    }
    .dissatisfaction {
      color: #c62828;
      font-weight: bold;
    }
    .notes-section {
      background: #fff3e0;
      border-left: 5px solid #f57c00;
      padding: 15px;
      margin-top: 30px;
      border-radius: 4px;
      page-break-inside: avoid;
    }
    .notes-section h3 {
      color: #e65100;
      margin-bottom: 10px;
      font-size: 14px;
      font-weight: bold;
    }
    .notes-section p {
      color: #555;
      font-size: 11px;
      line-height: 1.6;
      word-wrap: break-word;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      color: #999;
      font-size: 10px;
      border-top: 1px solid #ddd;
      padding-top: 20px;
      page-break-inside: avoid;
    }
    @media print {
      body { background: white; padding: 20px; }
      table { page-break-inside: avoid; }
      .notes-section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 RAPPORT DE SATISFACTION DES SERVICES</h1>
    <p>Analyse qualitative et quantitative de la satisfaction client</p>
  </div>

  <div class="metadata">
    <div class="metadata-row"><span class="metadata-label">Date du rapport:</span> ${dateStr}</div>
    <div class="metadata-row"><span class="metadata-label">Heure de génération:</span> ${timeStr}</div>
    <div class="metadata-row"><span class="metadata-label">Nombre total de services évalués:</span> ${SERVICES.length}</div>
    <div class="metadata-row"><span class="metadata-label">Nombre total de demandes:</span> ${totals.requests}</div>
  </div>

  <h2 style="color: #b71c1c; margin-top: 20px; margin-bottom: 15px; font-size: 16px;">Tableau Récapitulatif</h2>
  
  <table>
    <thead>
      <tr>
        <th>SERVICE</th>
        <th>DEMANDES</th>
        <th>SATISFAITS</th>
        <th>NON SATISFAITS</th>
        <th>% SATISFACTION</th>
        <th>% INSATISFACTION</th>
      </tr>
    </thead>
    <tbody>`;

    SERVICES.forEach((service) => {
      const serviceKey = service.toLowerCase() as keyof typeof data;
      const serviceData = data[serviceKey] as any;
      const rates = satisfactionReportService.calculateRates(serviceData);

      htmlContent += `
      <tr>
        <td style="text-align: left; font-weight: bold;">${service}</td>
        <td>${serviceData.requests}</td>
        <td style="color: #2e7d32;">${serviceData.satisfied}</td>
        <td style="color: #c62828;">${serviceData.unsatisfied}</td>
        <td class="satisfaction">${rates.satisfaction}%</td>
        <td class="dissatisfaction">${rates.dissatisfaction}%</td>
      </tr>`;
    });

    const totalRates = satisfactionReportService.calculateRates(totals);

    htmlContent += `
      <tr class="total-row">
        <td style="text-align: left;">TOTAL GLOBAL</td>
        <td>${totals.requests}</td>
        <td>${totals.satisfied}</td>
        <td>${totals.unsatisfied}</td>
        <td>${totalRates.satisfaction}%</td>
        <td>${totalRates.dissatisfaction}%</td>
      </tr>
    </tbody>
  </table>`;

    if (data.notes && data.notes.trim()) {
      htmlContent += `
  <div class="notes-section">
    <h3>📝 Notes et Observations</h3>
    <p>${data.notes.replace(/\n/g, "<br>")}</p>
  </div>`;
    }

    htmlContent += `
  <div class="footer">
    <p><strong>Rapport généré automatiquement</strong></p>
    <p>${dateStr} à ${timeStr}</p>
    <p style="margin-top: 10px; color: #bbb;">© 2026 Système de Gestion de la Flotte Véhiculaire - Tous droits réservés</p>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `satisfaction_${new Date().toISOString().split("T")[0]}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("📘 Export Word téléchargé");
  };

  const totals = satisfactionReportService.calculateTotals(data);

  return (
    <Card>
      <CardHeader>
        <CardTitle>📊 Rapport de Satisfaction des Services</CardTitle>
        <CardDescription>
          Enregistrez le nombre de demandes et le taux de satisfaction pour chaque service
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse border border-gray-300">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="border border-gray-300 p-2">SERVICES</th>
                <th className="border border-gray-300 p-2">NOMBRE DEMANDES</th>
                <th className="border border-gray-300 p-2">NOMBRES SATISFAIT</th>
                <th className="border border-gray-300 p-2">NOMBRE NON SATISFAITS</th>
                <th className="border border-gray-300 p-2">TAUX SATISFACTION</th>
                <th className="border border-gray-300 p-2">TAUX NON SATISFACTION</th>
              </tr>
            </thead>
            <tbody>
              {SERVICES.map((service) => {
                const serviceKey = service.toLowerCase() as keyof typeof data;
                const serviceData = data[serviceKey] as any;
                const rates = satisfactionReportService.calculateRates(serviceData);

                return (
                  <tr key={service} className="hover:bg-gray-100">
                    <td className="border border-gray-300 p-2 font-bold">{service}</td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        type="number"
                        min="0"
                        value={serviceData.requests}
                        onChange={(e) =>
                          handleInputChange(
                            serviceKey,
                            "requests",
                            parseInt(e.target.value) || 0
                          )
                        }
                        disabled={isReadOnly}
                        className="w-20 text-center"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        type="number"
                        min="0"
                        value={serviceData.satisfied}
                        onChange={(e) =>
                          handleInputChange(
                            serviceKey,
                            "satisfied",
                            parseInt(e.target.value) || 0
                          )
                        }
                        disabled={isReadOnly}
                        className="w-20 text-center"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        type="number"
                        min="0"
                        value={serviceData.unsatisfied}
                        onChange={(e) =>
                          handleInputChange(
                            serviceKey,
                            "unsatisfied",
                            parseInt(e.target.value) || 0
                          )
                        }
                        disabled={isReadOnly}
                        className="w-20 text-center"
                      />
                    </td>
                    <td className="border border-gray-300 p-2 bg-green-50">
                      <span className="font-semibold text-green-700">
                        {rates.satisfaction}%
                      </span>
                    </td>
                    <td className="border border-gray-300 p-2 bg-red-50">
                      <span className="font-semibold text-red-700">
                        {rates.dissatisfaction}%
                      </span>
                    </td>
                  </tr>
                );
              })}

              {/* TOTAL Row */}
              <tr className="font-bold bg-blue-100">
                <td className="border border-gray-300 p-2">TOTAL</td>
                <td className="border border-gray-300 p-2">{totals.requests}</td>
                <td className="border border-gray-300 p-2">{totals.satisfied}</td>
                <td className="border border-gray-300 p-2">{totals.unsatisfied}</td>
                <td className="border border-gray-300 p-2 bg-green-100">
                  {satisfactionReportService.calculateRates(totals).satisfaction}%
                </td>
                <td className="border border-gray-300 p-2 bg-red-100">
                  {satisfactionReportService.calculateRates(totals).dissatisfaction}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Notes */}
        <div className="mt-6 space-y-3">
          <label className="block font-semibold">Notes additionnelles</label>
          <textarea
            value={data.notes}
            onChange={(e) =>
              setData((prev) => ({
                ...prev,
                notes: e.target.value,
              }))
            }
            disabled={isReadOnly}
            className="w-full p-3 border border-gray-300 rounded-lg"
            rows={3}
            placeholder="Notes sur la satisfaction des services..."
          />
        </div>

        {/* Actions */}
        {!isReadOnly && (
          <div className="mt-6 flex gap-3 flex-wrap">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700"
            >
              ✅ Enregistrer les données
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Réinitialiser
            </Button>
          </div>
        )}

        {/* Export Buttons */}
        <div className="mt-6 flex gap-3 flex-wrap">
          <Button
            onClick={exportToExcel}
            className="bg-green-700 hover:bg-green-800 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </Button>
          <Button
            onClick={exportToPDF}
            className="bg-red-700 hover:bg-red-800 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
          <Button
            onClick={exportToWord}
            className="bg-blue-700 hover:bg-blue-800 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Word
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
