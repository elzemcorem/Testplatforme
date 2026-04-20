import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { toast } from "sonner";
import { CheckSquare, Eye, Calendar, User, PenTool, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Badge } from "./ui/badge";
import { useAuth } from "../contexts/AuthContext";
import { SignaturePad } from "./SignaturePad";

interface ChecklistItem {
  element: string;
  categorie: string;
  status: "ok" | "defect" | "repair" | null;
  notes?: string;
}

const CHECKLIST_ITEMS: Omit<ChecklistItem, 'status' | 'notes'>[] = [
  { element: "AVERTISSEUR SONORE", categorie: "Sécurité" },
  { element: "LAVE VITRE AV ET AR", categorie: "Entretien" },
  { element: "ESSUIE VITRE AV ES AR", categorie: "Entretien" },
  { element: "CLIMATISATION AV ET AR", categorie: "Confort" },
  { element: "FEUX/CLIGNOTANTS", categorie: "Éclairage" },
  { element: "RADIO", categorie: "Confort" },
  { element: "CLEFS", categorie: "Accessoire" },
  { element: "NIVEAU D'HUILE", categorie: "Mécanique" },
  { element: "VITRE ET PARE BRISE", categorie: "Accessoire" },
  { element: "ROUE DE SECOURS", categorie: "Outils" },
  { element: "CRIC", categorie: "Outils" },
  { element: "CLEFS DE ROUES", categorie: "Sécurité" },
  { element: "TRIANGLE", categorie: "Sécurité" },
  { element: "EXTINCTEUR", categorie: "Outils" },
  { element: "TROUSSE A OUTILS", categorie: "Hygiénique" },
  { element: "TAPIS DE SOL", categorie: "Sécurité" },
  { element: "BOITE A PHARMACIE", categorie: "Accessoire" },
  { element: "ANTENNE", categorie: "Accessoire" },
  { element: "CARNET D'ENTRETIEN", categorie: "Document" },
  { element: "CARNET DE BORD", categorie: "Document" },
];

interface SavedChecklist {
  id: string;
  vehicleId: string;
  vehicleName: string;
  inspectorName: string;
  date: Date;
  items: any[];
  globalNotes?: string;
  signature?: string;
}

export function VehicleChecklist() {
  const { currentUser } = useAuth();
  const [vehicleId, setVehicleId] = useState("");
  const [vehicleName, setVehicleName] = useState("");
  const [inspectorName, setInspectorName] = useState(currentUser?.name || "");
  const [globalNotes, setGlobalNotes] = useState("");
  const [signature, setSignature] = useState<string | null>(null);
  
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(
    CHECKLIST_ITEMS.map(item => ({ ...item, status: null, notes: "" }))
  );

  const [savedChecklists, setSavedChecklists] = useState<SavedChecklist[]>([]);
  const [selectedChecklist, setSelectedChecklist] = useState<SavedChecklist | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // Liste des véhicules disponibles
  const vehicles = [
    { id: "1", name: "Toyota Corolla" },
    { id: "2", name: "Honda CR-V" },
    { id: "3", name: "Toyota Hiace" },
  ];

  useEffect(() => {
    loadChecklists();
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
        setSavedChecklists(checklistsWithDates);
      } catch (error) {
        console.error("Error loading checklists:", error);
      }
    }
  };

  const calculateProgress = () => {
    const checkedItems = checklistItems.filter(item => item.status !== null).length;
    return Math.round((checkedItems / checklistItems.length) * 100);
  };

  const handleStatusChange = (index: number, status: "ok" | "defect" | "repair") => {
    const items = [...checklistItems];
    items[index] = {
      ...items[index],
      status: items[index].status === status ? null : status,
    };
    setChecklistItems(items);
  };

  const handleNotesChange = (index: number, notes: string) => {
    const items = [...checklistItems];
    items[index] = {
      ...items[index],
      notes,
    };
    setChecklistItems(items);
  };

  const handleReset = () => {
    if (confirm("Voulez-vous vraiment réinitialiser la fiche ?")) {
      setVehicleId("");
      setVehicleName("");
      setInspectorName(currentUser?.name || "");
      setGlobalNotes("");
      setSignature(null);
      setChecklistItems(CHECKLIST_ITEMS.map(item => ({ ...item, status: null, notes: "" })));
      toast.success("Fiche réinitialisée");
    }
  };

  const handleSave = () => {
    if (!vehicleId || !inspectorName) {
      toast.error("Veuillez sélectionner un véhicule et indiquer votre nom");
      return;
    }

    const selectedVehicle = vehicles.find(v => v.id === vehicleId);
    
    // Formater les items pour correspondre à la structure attendue par ReportsPage
    const formattedItems = checklistItems
      .filter(item => item.status !== null) // Ne sauvegarder que les items vérifiés
      .map(item => ({
        element: item.element,
        categorie: item.categorie,
        category: item.categorie, // Alias pour compatibilité
        item: item.element, // Alias pour compatibilité
        status: item.status,
        notes: item.notes || "",
      }));
    
    const newChecklist: SavedChecklist = {
      id: `checklist_${Date.now()}`,
      vehicleId,
      vehicleName: selectedVehicle?.name || vehicleName,
      inspectorName,
      date: new Date(),
      items: formattedItems,
      globalNotes,
      signature: signature || "",
    };

    const updatedChecklists = [...savedChecklists, newChecklist];
    localStorage.setItem("checklists", JSON.stringify(updatedChecklists));
    setSavedChecklists(updatedChecklists);
    
    toast.success("Fiche enregistrée avec succès !");
    handleReset();
    loadChecklists();
  };

  const handleViewChecklist = (checklist: SavedChecklist) => {
    setSelectedChecklist(checklist);
    setShowDetailDialog(true);
  };

  const progress = calculateProgress();

  const signaturePadRef = useRef<SignaturePad>(null);

  return (
    <div className="p-6 space-y-6 bg-background min-h-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CheckSquare className="w-8 h-8 text-primary" />
          Checklist Véhicules
        </h1>
        <p className="text-muted-foreground mt-1">
          Contrôle de l'état des véhicules
        </p>
      </div>

      {/* Formulaire de checklist */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle>Nouvelle Fiche d'État</CardTitle>
          <p className="text-sm text-muted-foreground">
            Complétez tous les champs pour enregistrer la fiche
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informations générales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vehicle">
                Véhicule <span className="text-red-500">*</span>
              </Label>
              <select
                id="vehicle"
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                value={vehicleId}
                onChange={(e) => {
                  setVehicleId(e.target.value);
                  const vehicle = vehicles.find(v => v.id === e.target.value);
                  setVehicleName(vehicle?.name || "");
                }}
              >
                <option value="">Sélectionner un véhicule</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inspector">
                Inspecteur <span className="text-red-500">*</span>
              </Label>
              <Input
                id="inspector"
                placeholder="Nom de l'inspecteur"
                value={inspectorName}
                onChange={(e) => setInspectorName(e.target.value)}
              />
            </div>
          </div>

          {/* Progression */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Progression</Label>
              <span className="text-2xl font-bold text-primary">{progress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className="bg-primary h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Liste des items à vérifier */}
          <div className="space-y-3">
            <Label>Éléments à vérifier ({checklistItems.length} éléments)</Label>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {checklistItems.map((item, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <p className="font-medium">{item.element}</p>
                        <p className="text-sm text-muted-foreground">{item.categorie}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={item.status === "ok" ? "default" : "outline"}
                          className={item.status === "ok" ? "bg-green-500 hover:bg-green-600 text-white" : ""}
                          onClick={() => handleStatusChange(index, "ok")}
                        >
                          OK
                        </Button>
                        <Button
                          size="sm"
                          variant={item.status === "defect" ? "default" : "outline"}
                          className={item.status === "defect" ? "bg-orange-500 hover:bg-orange-600 text-white" : ""}
                          onClick={() => handleStatusChange(index, "defect")}
                        >
                          Défaut
                        </Button>
                        <Button
                          size="sm"
                          variant={item.status === "repair" ? "default" : "outline"}
                          className={item.status === "repair" ? "bg-red-500 hover:bg-red-600 text-white" : ""}
                          onClick={() => handleStatusChange(index, "repair")}
                        >
                          À réparer
                        </Button>
                      </div>
                    </div>
                    {item.status && item.status !== "ok" && (
                      <Input
                        placeholder="Notes (optionnel)"
                        value={item.notes || ""}
                        onChange={(e) => handleNotesChange(index, e.target.value)}
                        className="text-sm"
                      />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Notes globales */}
          <div className="space-y-2">
            <Label htmlFor="global-notes">Notes globales (optionnel)</Label>
            <textarea
              id="global-notes"
              className="w-full px-3 py-2 border border-input rounded-md bg-background min-h-[100px]"
              placeholder="Ajoutez des notes générales sur l'état du véhicule..."
              value={globalNotes}
              onChange={(e) => setGlobalNotes(e.target.value)}
            />
          </div>

          {/* Signature */}
          <div className="space-y-2">
            <Label>Signature de l'inspecteur</Label>
            <SignaturePad ref={signaturePadRef} onSign={(data) => setSignature(data)} />
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-4">
            <Button
              onClick={handleSave}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              Enregistrer la fiche
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              className="flex-1"
            >
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Section des fiches enregistrées */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle>Fiches Enregistrées</CardTitle>
          <p className="text-sm text-muted-foreground">
            {savedChecklists.length} fiche(s) au total
          </p>
        </CardHeader>
        <CardContent>
          {savedChecklists.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Aucune fiche enregistrée pour le moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedChecklists.map((checklist) => {
                const okCount = checklist.items.filter((i: any) => i.status === "ok").length;
                const defectCount = checklist.items.filter((i: any) => i.status === "defect").length;
                const repairCount = checklist.items.filter((i: any) => i.status === "repair").length;
                
                return (
                  <Card
                    key={checklist.id}
                    className="cursor-pointer hover:border-primary/50 transition-all"
                    onClick={() => handleViewChecklist(checklist)}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{checklist.vehicleName}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <User className="w-3 h-3" />
                            {checklist.inspectorName}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(checklist.date).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <Button size="sm" variant="ghost">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <Badge className="bg-green-500 text-white">
                          {okCount} OK
                        </Badge>
                        <Badge className="bg-orange-500 text-white">
                          {defectCount} Défauts
                        </Badge>
                        <Badge className="bg-red-500 text-white">
                          {repairCount} Réparations
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de détail d'une fiche */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de la Fiche</DialogTitle>
            <DialogDescription>
              {selectedChecklist?.vehicleName} - Inspecteur: {selectedChecklist?.inspectorName}
            </DialogDescription>
          </DialogHeader>

          {selectedChecklist && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-500">
                    {selectedChecklist.items.filter((i: any) => i.status === "ok").length}
                  </p>
                  <p className="text-sm text-muted-foreground">OK</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-500">
                    {selectedChecklist.items.filter((i: any) => i.status === "defect").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Défauts</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-500">
                    {selectedChecklist.items.filter((i: any) => i.status === "repair").length}
                  </p>
                  <p className="text-sm text-muted-foreground">À réparer</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Éléments vérifiés :</Label>
                <div className="space-y-2">
                  {selectedChecklist.items.map((item: any, index: number) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border-l-4 ${
                        item.status === "ok"
                          ? "bg-green-50 dark:bg-green-950/20 border-green-500"
                          : item.status === "defect"
                          ? "bg-orange-50 dark:bg-orange-950/20 border-orange-500"
                          : item.status === "repair"
                          ? "bg-red-50 dark:bg-red-950/20 border-red-500"
                          : "bg-gray-50 dark:bg-gray-950/20 border-gray-300"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">
                            {item.categorie || item.category} - {item.element || item.item}
                          </p>
                          {item.notes && (
                            <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>
                          )}
                        </div>
                        <Badge
                          className={
                            item.status === "ok"
                              ? "bg-green-500"
                              : item.status === "defect"
                              ? "bg-orange-500"
                              : item.status === "repair"
                              ? "bg-red-500"
                              : "bg-gray-500"
                          }
                        >
                          {item.status === "ok"
                            ? "OK"
                            : item.status === "defect"
                            ? "Défaut"
                            : item.status === "repair"
                            ? "À réparer"
                            : "Non vérifié"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedChecklist.globalNotes && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                  <p className="font-medium text-sm text-blue-700 dark:text-blue-400 mb-1">
                    Notes globales :
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-300">
                    {selectedChecklist.globalNotes}
                  </p>
                </div>
              )}

              {selectedChecklist.signature && (
                <div className="p-4 bg-gray-50 dark:bg-gray-950/20 rounded-lg border border-gray-200 dark:border-gray-900">
                  <p className="font-medium text-sm text-gray-700 dark:text-gray-400 mb-1">
                    Signature de l'inspecteur :
                  </p>
                  <img
                    src={selectedChecklist.signature}
                    alt="Signature de l'inspecteur"
                    className="w-full h-auto"
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}