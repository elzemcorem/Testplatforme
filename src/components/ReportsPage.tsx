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
import { Calendar, Download, FileText, Filter } from "lucide-react";
import { toast } from "sonner";
import { format, isAfter, isBefore, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";

interface Checklist {
  id: string;
  vehicleName: string;
  vehicleId: string;
  inspectorName: string;
  date: Date;
  items: {
    category: string;
    item: string;
    status: "ok" | "defect" | "repair";
    notes?: string;
  }[];
  globalNotes?: string;
}

export function ReportsPage() {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportData, setReportData] = useState<Checklist[]>([]);
  const [reportDate, setReportDate] = useState("");

  useEffect(() => {
    loadChecklists();
    const interval = setInterval(loadChecklists, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadChecklists = () => {
    const stored = localStorage.getItem("checklists");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const checklistsWithDates = parsed.map((checklist: any) => ({
          ...checklist,
          date: new Date(checklist.date),
        }));
        setChecklists(checklistsWithDates);
      } catch (error) {
        console.error("Error loading checklists:", error);
      }
    }
  };

  const handleGenerateReport = () => {
    if (!selectedDate) {
      toast.error("Veuillez sélectionner une date");
      return;
    }

    const targetDate = new Date(selectedDate);
    const filteredChecklists = checklists.filter((checklist) =>
      isSameDay(checklist.date, targetDate)
    );

    if (filteredChecklists.length === 0) {
      toast.error("Aucune fiche trouvée pour cette date");
      return;
    }

    setReportData(filteredChecklists);
    setReportDate(format(targetDate, "PPP", { locale: fr }));
    setShowReportDialog(true);
  };

  const generatePDFReport = () => {
    // Créer le contenu du rapport en format texte
    let reportContent = `RAPPORT DE FICHES VÉHICULES\n`;
    reportContent += `Date: ${reportDate}\n`;
    reportContent += `Généré le: ${format(new Date(), "PPP à p", { locale: fr })}\n`;
    reportContent += `\n${"=".repeat(80)}\n\n`;

    reportData.forEach((checklist, index) => {
      reportContent += `FICHE ${index + 1}/${reportData.length}\n`;
      reportContent += `${"-".repeat(80)}\n`;
      reportContent += `Véhicule: ${checklist.vehicleName}\n`;
      reportContent += `Inspecteur: ${checklist.inspectorName}\n`;
      reportContent += `Date d'inspection: ${format(checklist.date, "PPP à p", { locale: fr })}\n\n`;

      // Statistiques
      const totalItems = checklist.items.length;
      const okItems = checklist.items.filter((item) => item.status === "ok").length;
      const defectItems = checklist.items.filter((item) => item.status === "defect").length;
      const repairItems = checklist.items.filter((item) => item.status === "repair").length;

      reportContent += `RÉSUMÉ:\n`;
      reportContent += `  Total des points de contrôle: ${totalItems}\n`;
      reportContent += `  ✓ OK: ${okItems} (${Math.round((okItems / totalItems) * 100)}%)\n`;
      reportContent += `  ! Défauts: ${defectItems} (${Math.round((defectItems / totalItems) * 100)}%)\n`;
      reportContent += `  ⚠ À réparer: ${repairItems} (${Math.round((repairItems / totalItems) * 100)}%)\n\n`;

      reportContent += `DÉTAILS DES CONTRÔLES:\n`;
      
      // Filtrer uniquement les items qui ont un statut (pas les null)
      const validItems = checklist.items.filter((item: any) => item.status !== null);
      
      // Grouper par catégorie
      const categories = [...new Set(validItems.map((item: any) => item.category || item.categorie))];
      categories.forEach((category) => {
        reportContent += `\n  ${(category || "Non catégorisé").toUpperCase()}:\n`;
        const categoryItems = validItems.filter((item: any) => (item.category || item.categorie) === category);
        categoryItems.forEach((item: any) => {
          const statusSymbol = item.status === "ok" ? "✓" : item.status === "defect" ? "!" : "⚠";
          const statusText = item.status === "ok" ? "OK" : item.status === "defect" ? "Défaut" : "À réparer";
          const elementName = item.item || item.element || "Élément non défini";
          reportContent += `    ${statusSymbol} ${elementName}: ${statusText}\n`;
          if (item.notes) {
            reportContent += `       Notes: ${item.notes}\n`;
          }
        });
      });

      if (checklist.globalNotes) {
        reportContent += `\nNOTES GLOBALES:\n${checklist.globalNotes}\n`;
      }

      reportContent += `\n${"=".repeat(80)}\n\n`;
    });

    // Créer un blob et télécharger
    const blob = new Blob([reportContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rapport_fiches_${format(new Date(selectedDate), "yyyy-MM-dd")}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Rapport téléchargé avec succès");
  };

  const generateWordReport = () => {
    // Créer le contenu du rapport en format HTML (compatible Word)
    let htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Rapport de Fiches Véhicules</title>
  <style>
    body { font-family: 'Calibri', sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
    h1 { color: #16a34a; border-bottom: 3px solid #16a34a; padding-bottom: 10px; }
    h2 { color: #059669; margin-top: 30px; border-bottom: 2px solid #d1fae5; padding-bottom: 8px; }
    h3 { color: #047857; margin-top: 20px; }
    .meta { color: #666; font-size: 14px; margin-bottom: 20px; }
    .stats { background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .stat-item { margin: 8px 0; font-weight: 500; }
    .ok { color: #16a34a; }
    .defect { color: #f59e0b; }
    .repair { color: #ef4444; }
    .item { margin: 10px 0; padding: 8px; background: #f9fafb; border-left: 3px solid #e5e7eb; }
    .item-ok { border-left-color: #16a34a; }
    .item-defect { border-left-color: #f59e0b; }
    .item-repair { border-left-color: #ef4444; }
    .notes { font-style: italic; color: #666; margin-top: 5px; font-size: 14px; }
    .global-notes { background: #fffbeb; padding: 15px; border-radius: 8px; margin-top: 20px; }
    .separator { margin: 40px 0; border-top: 2px solid #e5e7eb; }
  </style>
</head>
<body>
  <h1>RAPPORT DE FICHES VÉHICULES</h1>
  <div class="meta">
    <p><strong>Date:</strong> ${reportDate}</p>
    <p><strong>Généré le:</strong> ${format(new Date(), "PPP à p", { locale: fr })}</p>
    <p><strong>Nombre de fiches:</strong> ${reportData.length}</p>
  </div>
`;

    reportData.forEach((checklist, index) => {
      const totalItems = checklist.items.length;
      const okItems = checklist.items.filter((item) => item.status === "ok").length;
      const defectItems = checklist.items.filter((item) => item.status === "defect").length;
      const repairItems = checklist.items.filter((item) => item.status === "repair").length;

      htmlContent += `
  ${index > 0 ? '<div class="separator"></div>' : ''}
  <h2>FICHE ${index + 1}/${reportData.length} - ${checklist.vehicleName}</h2>
  <div class="meta">
    <p><strong>Inspecteur:</strong> ${checklist.inspectorName}</p>
    <p><strong>Date d'inspection:</strong> ${format(checklist.date, "PPP à p", { locale: fr })}</p>
  </div>
  
  <div class="stats">
    <h3>Résumé</h3>
    <div class="stat-item">Total des points de contrôle: <strong>${totalItems}</strong></div>
    <div class="stat-item ok">✓ OK: ${okItems} (${Math.round((okItems / totalItems) * 100)}%)</div>
    <div class="stat-item defect">! Défauts: ${defectItems} (${Math.round((defectItems / totalItems) * 100)}%)</div>
    <div class="stat-item repair">⚠ À réparer: ${repairItems} (${Math.round((repairItems / totalItems) * 100)}%)</div>
  </div>
  
  <h3>Détails des Contrôles</h3>
`;

      // Filtrer uniquement les items qui ont un statut (pas les null)
      const validItems = checklist.items.filter((item: any) => item.status !== null);
      
      // Grouper par catégorie
      const categories = [...new Set(validItems.map((item: any) => item.category || item.categorie))];
      categories.forEach((category) => {
        htmlContent += `<h4>${category || "Non catégorisé"}</h4>`;
        const categoryItems = validItems.filter((item: any) => (item.category || item.categorie) === category);
        categoryItems.forEach((item: any) => {
          const statusSymbol = item.status === "ok" ? "✓" : item.status === "defect" ? "!" : "⚠";
          const statusText = item.status === "ok" ? "OK" : item.status === "defect" ? "Défaut" : "À réparer";
          const statusClass = item.status === "ok" ? "ok" : item.status === "defect" ? "defect" : "repair";
          const elementName = item.item || item.element || "Élément non défini";
          
          htmlContent += `
  <div class="item item-${item.status}">
    <span class="${statusClass}"><strong>${statusSymbol} ${elementName}:</strong> ${statusText}</span>
    ${item.notes ? `<div class="notes">Notes: ${item.notes}</div>` : ''}
  </div>
`;
        });
      });

      if (checklist.globalNotes) {
        htmlContent += `
  <div class="global-notes">
    <h4>Notes Globales</h4>
    <p>${checklist.globalNotes}</p>
  </div>
`;
      }
    });

    htmlContent += `
</body>
</html>`;

    // Créer un blob et télécharger
    const blob = new Blob([htmlContent], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rapport_fiches_${format(new Date(selectedDate), "yyyy-MM-dd")}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Rapport Word téléchargé avec succès");
  };

  const generatePDFHtmlReport = () => {
    // Créer le contenu HTML pour PDF
    let htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Rapport de Fiches Véhicules</title>
  <style>
    @page { margin: 2cm; }
    body { 
      font-family: 'Arial', sans-serif; 
      max-width: 800px; 
      margin: 0 auto; 
      padding: 20px;
      line-height: 1.6;
    }
    h1 { 
      color: #16a34a; 
      border-bottom: 3px solid #16a34a; 
      padding-bottom: 10px;
      page-break-after: avoid;
    }
    h2 { 
      color: #059669; 
      margin-top: 30px; 
      border-bottom: 2px solid #d1fae5; 
      padding-bottom: 8px;
      page-break-after: avoid;
    }
    h3 { 
      color: #047857; 
      margin-top: 20px;
      page-break-after: avoid;
    }
    .meta { color: #666; font-size: 14px; margin-bottom: 20px; }
    .stats { 
      background: #f0fdf4; 
      padding: 15px; 
      border-radius: 8px; 
      margin: 20px 0;
      page-break-inside: avoid;
    }
    .stat-item { margin: 8px 0; font-weight: 500; }
    .ok { color: #16a34a; }
    .defect { color: #f59e0b; }
    .repair { color: #ef4444; }
    .item { 
      margin: 10px 0; 
      padding: 8px; 
      background: #f9fafb; 
      border-left: 3px solid #e5e7eb;
      page-break-inside: avoid;
    }
    .item-ok { border-left-color: #16a34a; }
    .item-defect { border-left-color: #f59e0b; }
    .item-repair { border-left-color: #ef4444; }
    .notes { font-style: italic; color: #666; margin-top: 5px; font-size: 14px; }
    .global-notes { 
      background: #fffbeb; 
      padding: 15px; 
      border-radius: 8px; 
      margin-top: 20px;
      page-break-inside: avoid;
    }
    .separator { 
      margin: 40px 0; 
      border-top: 2px solid #e5e7eb;
      page-break-before: always;
    }
  </style>
</head>
<body>
  <h1>RAPPORT DE FICHES VÉHICULES</h1>
  <div class="meta">
    <p><strong>Date:</strong> ${reportDate}</p>
    <p><strong>Généré le:</strong> ${format(new Date(), "PPP à p", { locale: fr })}</p>
    <p><strong>Nombre de fiches:</strong> ${reportData.length}</p>
  </div>
`;

    reportData.forEach((checklist, index) => {
      const totalItems = checklist.items.length;
      const okItems = checklist.items.filter((item: any) => item.status === "ok").length;
      const defectItems = checklist.items.filter((item: any) => item.status === "defect").length;
      const repairItems = checklist.items.filter((item: any) => item.status === "repair").length;

      htmlContent += `
  ${index > 0 ? '<div class="separator"></div>' : ''}
  <h2>FICHE ${index + 1}/${reportData.length} - ${checklist.vehicleName}</h2>
  <div class="meta">
    <p><strong>Inspecteur:</strong> ${checklist.inspectorName}</p>
    <p><strong>Date d'inspection:</strong> ${format(checklist.date, "PPP à p", { locale: fr })}</p>
  </div>
  
  <div class="stats">
    <h3>Résumé</h3>
    <div class="stat-item">Total des points de contrôle: <strong>${totalItems}</strong></div>
    <div class="stat-item ok">✓ OK: ${okItems} (${Math.round((okItems / totalItems) * 100)}%)</div>
    <div class="stat-item defect">! Défauts: ${defectItems} (${Math.round((defectItems / totalItems) * 100)}%)</div>
    <div class="stat-item repair">⚠ À réparer: ${repairItems} (${Math.round((repairItems / totalItems) * 100)}%)</div>
  </div>
  
  <h3>Détails des Contrôles</h3>
`;

      // Grouper par catégorie
      const validItems = checklist.items.filter((item: any) => item.status !== null);
      const categories = [...new Set(validItems.map((item: any) => item.category || item.categorie))];
      categories.forEach((category) => {
        htmlContent += `<h4>${category || "Non catégorisé"}</h4>`;
        const categoryItems = validItems.filter((item: any) => (item.category || item.categorie) === category);
        categoryItems.forEach((item: any) => {
          const statusSymbol = item.status === "ok" ? "✓" : item.status === "defect" ? "!" : "⚠";
          const statusText = item.status === "ok" ? "OK" : item.status === "defect" ? "Défaut" : "À réparer";
          const statusClass = item.status === "ok" ? "ok" : item.status === "defect" ? "defect" : "repair";
          const elementName = item.item || item.element || "Élément non défini";
          
          htmlContent += `
  <div class="item item-${item.status}">
    <span class="${statusClass}"><strong>${statusSymbol} ${elementName}:</strong> ${statusText}</span>
    ${item.notes ? `<div class="notes">Notes: ${item.notes}</div>` : ''}
  </div>
`;
        });
      });

      if (checklist.globalNotes) {
        htmlContent += `
  <div class="global-notes">
    <h4>Notes Globales</h4>
    <p>${checklist.globalNotes}</p>
  </div>
`;
      }
    });

    htmlContent += `
</body>
</html>`;

    // Créer un blob et télécharger
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rapport_fiches_${format(new Date(selectedDate), "yyyy-MM-dd")}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Rapport PDF (HTML) téléchargé avec succès", {
      description: "Ouvrez le fichier HTML dans votre navigateur et utilisez Ctrl+P pour imprimer en PDF"
    });
  };

  const generatePNGReport = () => {
    // Pour PNG, nous créons une représentation visuelle simple
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    
    // Calculer la hauteur nécessaire
    const lineHeight = 25;
    const titleHeight = 80;
    const metaHeight = 80;
    const statsHeight = 150;
    const itemsPerChecklist = reportData.reduce((sum, checklist) => sum + checklist.items.length, 0);
    const itemsHeight = itemsPerChecklist * 30 + reportData.length * 200;
    
    canvas.height = titleHeight + metaHeight + statsHeight + itemsHeight + 100;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fond blanc
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let y = 40;

    // Titre
    ctx.fillStyle = '#16a34a';
    ctx.font = 'bold 28px Arial';
    ctx.fillText('RAPPORT DE FICHES VÉHICULES', 30, y);
    y += 40;

    // Ligne de séparation
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(30, y);
    ctx.lineTo(770, y);
    ctx.stroke();
    y += 30;

    // Métadonnées
    ctx.fillStyle = '#666666';
    ctx.font = '14px Arial';
    ctx.fillText(`Date: ${reportDate}`, 30, y);
    y += 25;
    ctx.fillText(`Généré le: ${format(new Date(), "PPP à p", { locale: fr })}`, 30, y);
    y += 25;
    ctx.fillText(`Nombre de fiches: ${reportData.length}`, 30, y);
    y += 40;

    // Pour chaque checklist
    reportData.forEach((checklist, index) => {
      const totalItems = checklist.items.length;
      const okItems = checklist.items.filter((item: any) => item.status === "ok").length;
      const defectItems = checklist.items.filter((item: any) => item.status === "defect").length;
      const repairItems = checklist.items.filter((item: any) => item.status === "repair").length;

      // Titre de la fiche
      ctx.fillStyle = '#059669';
      ctx.font = 'bold 20px Arial';
      ctx.fillText(`FICHE ${index + 1}/${reportData.length} - ${checklist.vehicleName}`, 30, y);
      y += 30;

      // Inspecteur et date
      ctx.fillStyle = '#666666';
      ctx.font = '12px Arial';
      ctx.fillText(`Inspecteur: ${checklist.inspectorName}`, 30, y);
      y += 20;
      ctx.fillText(`Date: ${format(checklist.date, "PPP à p", { locale: fr })}`, 30, y);
      y += 30;

      // Résumé
      ctx.fillStyle = '#f0fdf4';
      ctx.fillRect(30, y, 740, 100);
      ctx.strokeStyle = '#d1fae5';
      ctx.strokeRect(30, y, 740, 100);
      
      y += 25;
      ctx.fillStyle = '#047857';
      ctx.font = 'bold 14px Arial';
      ctx.fillText('Résumé', 40, y);
      y += 20;
      
      ctx.font = '12px Arial';
      ctx.fillStyle = '#000000';
      ctx.fillText(`Total: ${totalItems} points de contrôle`, 40, y);
      y += 20;
      ctx.fillStyle = '#16a34a';
      ctx.fillText(`✓ OK: ${okItems} (${Math.round((okItems / totalItems) * 100)}%)`, 40, y);
      ctx.fillStyle = '#f59e0b';
      ctx.fillText(`! Défauts: ${defectItems} (${Math.round((defectItems / totalItems) * 100)}%)`, 250, y);
      ctx.fillStyle = '#ef4444';
      ctx.fillText(`⚠ À réparer: ${repairItems} (${Math.round((repairItems / totalItems) * 100)}%)`, 460, y);
      y += 40;

      // Items (afficher les premiers seulement pour éviter un PNG trop long)
      const validItems = checklist.items.filter((item: any) => item.status !== null).slice(0, 10);
      validItems.forEach((item: any) => {
        const elementName = item.item || item.element || "Élément non défini";
        const statusText = item.status === "ok" ? "OK" : item.status === "defect" ? "Défaut" : "À réparer";
        
        ctx.fillStyle = item.status === "ok" ? '#16a34a' : item.status === "defect" ? '#f59e0b' : '#ef4444';
        ctx.font = '11px Arial';
        ctx.fillText(`${elementName}: ${statusText}`, 40, y);
        y += 20;
      });

      if (checklist.items.length > 10) {
        ctx.fillStyle = '#666666';
        ctx.fillText(`... et ${checklist.items.length - 10} autres éléments`, 40, y);
        y += 20;
      }

      y += 40;
    });

    // Convertir en PNG et télécharger
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `rapport_fiches_${format(new Date(selectedDate), "yyyy-MM-dd")}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("Rapport PNG téléchargé avec succès");
      }
    }, 'image/png');
  };

  return (
    <div className="p-6 space-y-6 bg-background min-h-full">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Rapports</h1>
        <p className="text-muted-foreground mt-1">
          Générez des rapports basés sur les fiches véhicules
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total des fiches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{checklists.length}</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Fiches cette semaine
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-500">
              {
                checklists.filter((c) => {
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return isAfter(c.date, weekAgo);
                }).length
              }
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Fiches ce mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-500">
              {
                checklists.filter((c) => {
                  const monthAgo = new Date();
                  monthAgo.setMonth(monthAgo.getMonth() - 1);
                  return isAfter(c.date, monthAgo);
                }).length
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Section de génération de rapport */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Générer un rapport
          </CardTitle>
          <CardDescription>
            Sélectionnez une date pour générer un rapport des fiches véhicules
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="report-date">
              Date du rapport <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-4">
              <Input
                id="report-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleGenerateReport}
                className="bg-primary hover:bg-primary/90"
                disabled={!selectedDate}
              >
                <Filter className="w-4 h-4 mr-2" />
                Générer le rapport
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Le rapport inclura toutes les fiches créées à la date sélectionnée
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de visualisation du rapport */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Rapport de Fiches Véhicules</DialogTitle>
            <DialogDescription>
              Date: {reportDate} • {reportData.length} fiche(s)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {reportData.map((checklist, index) => {
              const totalItems = checklist.items.length;
              const okItems = checklist.items.filter((item) => item.status === "ok").length;
              const defectItems = checklist.items.filter((item) => item.status === "defect").length;
              const repairItems = checklist.items.filter((item) => item.status === "repair").length;

              return (
                <Card key={checklist.id} className="border-2 border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Fiche {index + 1}/{reportData.length} - {checklist.vehicleName}
                    </CardTitle>
                    <CardDescription>
                      Inspecteur: {checklist.inspectorName} •{" "}
                      {format(checklist.date, "PPP à p", { locale: fr })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Statistiques */}
                    <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-500">{okItems}</p>
                        <p className="text-sm text-muted-foreground">
                          OK ({Math.round((okItems / totalItems) * 100)}%)
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-orange-500">{defectItems}</p>
                        <p className="text-sm text-muted-foreground">
                          Défauts ({Math.round((defectItems / totalItems) * 100)}%)
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-500">{repairItems}</p>
                        <p className="text-sm text-muted-foreground">
                          À réparer ({Math.round((repairItems / totalItems) * 100)}%)
                        </p>
                      </div>
                    </div>

                    {/* Détails */}
                    <div className="space-y-2">
                      {checklist.items.map((item, itemIndex) => (
                        <div
                          key={itemIndex}
                          className={`p-3 rounded-lg border-l-4 ${
                            item.status === "ok"
                              ? "bg-green-50 dark:bg-green-950/20 border-green-500"
                              : item.status === "defect"
                              ? "bg-orange-50 dark:bg-orange-950/20 border-orange-500"
                              : "bg-red-50 dark:bg-red-950/20 border-red-500"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-sm">
                                {item.category} - {item.item}
                              </p>
                              {item.notes && (
                                <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>
                              )}
                            </div>
                            <span
                              className={`text-xs font-semibold px-2 py-1 rounded ${
                                item.status === "ok"
                                  ? "bg-green-500 text-white"
                                  : item.status === "defect"
                                  ? "bg-orange-500 text-white"
                                  : "bg-red-500 text-white"
                              }`}
                            >
                              {item.status === "ok"
                                ? "OK"
                                : item.status === "defect"
                                ? "Défaut"
                                : "À réparer"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {checklist.globalNotes && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                        <p className="font-medium text-sm text-blue-700 dark:text-blue-400 mb-1">
                          Notes globales :
                        </p>
                        <p className="text-sm text-blue-600 dark:text-blue-300">
                          {checklist.globalNotes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setShowReportDialog(false)} className="order-last sm:order-first">
              Fermer
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={generatePDFReport}
                className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                TXT
              </Button>
              <Button
                variant="outline"
                onClick={generateWordReport}
                className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Word
              </Button>
              <Button
                variant="outline"
                onClick={generatePDFHtmlReport}
                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button
                variant="outline"
                onClick={generatePNGReport}
                className="border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                PNG
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}