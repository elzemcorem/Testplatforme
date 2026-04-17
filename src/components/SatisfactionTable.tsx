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

    let csv = "SERVICES,NOMBRE DEMANDES,NOMBRES SATISFAIT,NOMBRE NON SATISFAITS,TAUX SATISFACTION,TAUX NON SATISFACTION\n";

    SERVICES.forEach((service) => {
      const serviceKey = service.toLowerCase() as keyof typeof data;
      const serviceData = data[serviceKey] as any;
      const rates = satisfactionReportService.calculateRates(serviceData);

      csv += `${service},${serviceData.requests},${serviceData.satisfied},${serviceData.unsatisfied},${rates.satisfaction}%,${rates.dissatisfaction}%\n`;
    });

    // TOTAL
    const totalRates = satisfactionReportService.calculateRates(totals);
    csv += `TOTAL,${totals.requests},${totals.satisfied},${totals.unsatisfied},${totalRates.satisfaction}%,${totalRates.dissatisfaction}%\n`;

    if (data.notes) {
      csv += `\nNOTES,${data.notes}`;
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

    toast.success("📊 Export Excel téléchargé");
  };

  const exportToPDF = () => {
    const totals = satisfactionReportService.calculateTotals(data);

    let pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< >>
stream
BT
/F1 12 Tf
50 750 Td
(RAPPORT DE SATISFACTION) Tj
0 -20 Td
(Services) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
trailer
<< /Size 6 /Root 1 0 R >>
startxref
0
%%EOF`;

    const blob = new Blob([pdfContent], { type: "application/pdf" });
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

    let htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Rapport de Satisfaction</title>
  <style>
    body { font-family: Calibri; margin: 40px; }
    h1 { color: #2c5aa0; text-align: center; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #000; padding: 10px; text-align: center; }
    th { background-color: #2c5aa0; color: white; }
    tr:nth-child(even) { background-color: #f0f0f0; }
    .total-row { font-weight: bold; background-color: #d9e1f2; }
    .notes { margin-top: 20px; }
  </style>
</head>
<body>
  <h1>RAPPORT DE SATISFACTION</h1>
  <p style="text-align: center; color: #666;">Généré le ${new Date().toLocaleDateString("fr-FR")}</p>
  
  <table>
    <thead>
      <tr>
        <th>SERVICES</th>
        <th>NOMBRE DEMANDES</th>
        <th>NOMBRES SATISFAIT</th>
        <th>NOMBRE NON SATISFAITS</th>
        <th>TAUX SATISFACTION</th>
        <th>TAUX NON SATISFACTION</th>
      </tr>
    </thead>
    <tbody>`;

    SERVICES.forEach((service) => {
      const serviceKey = service.toLowerCase() as keyof typeof data;
      const serviceData = data[serviceKey] as any;
      const rates = satisfactionReportService.calculateRates(serviceData);

      htmlContent += `
      <tr>
        <td>${service}</td>
        <td>${serviceData.requests}</td>
        <td>${serviceData.satisfied}</td>
        <td>${serviceData.unsatisfied}</td>
        <td>${rates.satisfaction}%</td>
        <td>${rates.dissatisfaction}%</td>
      </tr>`;
    });

    // TOTAL
    const totalRates = satisfactionReportService.calculateRates(totals);
    htmlContent += `
      <tr class="total-row">
        <td>TOTAL</td>
        <td>${totals.requests}</td>
        <td>${totals.satisfied}</td>
        <td>${totals.unsatisfied}</td>
        <td>${totalRates.satisfaction}%</td>
        <td>${totalRates.dissatisfaction}%</td>
      </tr>
    </tbody>
  </table>`;

    if (data.notes) {
      htmlContent += `
  <div class="notes">
    <h3>NOTES</h3>
    <p>${data.notes}</p>
  </div>`;
    }

    htmlContent += `
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `satisfaction_${new Date().toISOString().split("T")[0]}.html`;
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
