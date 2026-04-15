import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner';
import { CheckSquare, Eye, Calendar, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Badge } from './ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { useVehicles } from '../hooks/useVehicles';
import { supabase } from '../lib/supabase';

interface ChecklistItem {
  element: string;
  categorie: string;
  status: 'ok' | 'defect' | 'repair' | null;
  notes?: string;
}

const CHECKLIST_ITEMS: Omit<ChecklistItem, 'status' | 'notes'>[] = [
  { element: 'AVERTISSEUR SONORE', categorie: 'Sécurité' },
  { element: 'LAVE VITRE AV ET AR', categorie: 'Entretien' },
  { element: 'ESSUIE VITRE AV ET AR', categorie: 'Entretien' },
  { element: 'CLIMATISATION AV ET AR', categorie: 'Confort' },
  { element: 'FEUX/CLIGNOTANTS', categorie: 'Éclairage' },
  { element: 'RADIO', categorie: 'Confort' },
  { element: 'CLEFS', categorie: 'Accessoire' },
  { element: "NIVEAU D'HUILE", categorie: 'Mécanique' },
  { element: 'VITRE ET PARE BRISE', categorie: 'Accessoire' },
  { element: 'ROUE DE SECOURS', categorie: 'Outils' },
  { element: 'CRIC', categorie: 'Outils' },
  { element: 'CLEFS DE ROUES', categorie: 'Sécurité' },
  { element: 'TRIANGLE', categorie: 'Sécurité' },
  { element: 'EXTINCTEUR', categorie: 'Outils' },
  { element: 'TROUSSE A OUTILS', categorie: 'Hygiénique' },
  { element: 'TAPIS DE SOL', categorie: 'Sécurité' },
  { element: 'BOITE A PHARMACIE', categorie: 'Accessoire' },
];

const initialItems = (): ChecklistItem[] =>
  CHECKLIST_ITEMS.map((item) => ({ ...item, status: null, notes: '' }));

export function VehicleChecklist() {
  const { currentUser } = useAuth();
  // ✅ Véhicules depuis Supabase — plus de liste hardcodée
  const { vehicles, loading: vehiclesLoading } = useVehicles();

  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [checklistType, setChecklistType]         = useState<'departure' | 'return'>('departure');
  const [fuelLevel, setFuelLevel]                 = useState('');
  const [mileage, setMileage]                     = useState('');
  const [items, setItems]                         = useState<ChecklistItem[]>(initialItems());
  const [viewDialogOpen, setViewDialogOpen]       = useState(false);
  const [saving, setSaving]                       = useState(false);

  const completedCount = items.filter((i) => i.status !== null).length;
  const progressPct    = Math.round((completedCount / items.length) * 100);

  const updateItem = (index: number, status: ChecklistItem['status'], notes?: string) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], status, notes: notes ?? next[index].notes };
      return next;
    });
  };

  const handleSave = async () => {
    if (!selectedVehicleId) {
      toast.error('Veuillez sélectionner un véhicule');
      return;
    }
    if (!fuelLevel || !mileage) {
      toast.error('Veuillez renseigner le niveau de carburant et le kilométrage');
      return;
    }

    setSaving(true);
    try {
      // ✅ Sauvegarder dans Supabase
      const { data: checklist, error: chkErr } = await supabase
        .from('vehicle_checklists')
        .insert({
          vehicle_id:  selectedVehicleId,
          user_id:     currentUser?.id,
          type:        checklistType,
          fuel_level:  fuelLevel,
          mileage:     parseInt(mileage, 10),
        })
        .select()
        .single();

      if (chkErr || !checklist) {
        toast.error('Erreur lors de la sauvegarde de la checklist');
        return;
      }

      // Sauvegarder les éléments de la checklist
      const checklistItems = items.map((item) => ({
        checklist_id: checklist.id,
        label:        item.element,
        category:     item.categorie,
        is_checked:   item.status === 'ok',
        status:       item.status,
        notes:        item.notes || null,
      }));

      const { error: itemsErr } = await supabase
        .from('checklist_items')
        .insert(checklistItems);

      if (itemsErr) {
        toast.error('Checklist enregistrée mais erreur sur les éléments');
        return;
      }

      toast.success(
        `Fiche de ${checklistType === 'departure' ? 'départ' : 'retour'} enregistrée avec succès !`
      );
      // Reset
      setItems(initialItems());
      setFuelLevel('');
      setMileage('');
      setSelectedVehicleId('');
    } catch (err) {
      console.error('Checklist save error:', err);
      toast.error('Une erreur inattendue est survenue');
    } finally {
      setSaving(false);
    }
  };

  const selectedVehicleName =
    vehicles.find((v) => v.id === selectedVehicleId)?.name ?? 'Aucun véhicule sélectionné';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Checklist Véhicule</h1>
        <Button variant="outline" onClick={() => setViewDialogOpen(true)}>
          <Eye className="w-4 h-4 mr-2" />
          Voir les fiches
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-primary" />
            Nouvelle fiche
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Type départ / retour */}
          <div className="grid gap-2">
            <Label>Type de fiche</Label>
            <div className="flex gap-3">
              {(['departure', 'return'] as const).map((t) => (
                <Button
                  key={t}
                  variant={checklistType === t ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChecklistType(t)}
                >
                  {t === 'departure' ? '🚀 Départ' : '🏁 Retour'}
                </Button>
              ))}
            </div>
          </div>

          {/* Sélection véhicule */}
          <div className="grid gap-2">
            <Label htmlFor="vehicle-select">Véhicule</Label>
            {vehiclesLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Chargement des véhicules…
              </div>
            ) : (
              <select
                id="vehicle-select"
                className="border rounded-md px-3 py-2 text-sm bg-background"
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
              >
                <option value="">-- Sélectionner un véhicule --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} {v.plate ? `(${v.plate})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Carburant & kilométrage */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="fuel">Niveau carburant</Label>
              <Input
                id="fuel"
                placeholder="ex: 3/4"
                value={fuelLevel}
                onChange={(e) => setFuelLevel(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mileage">Kilométrage</Label>
              <Input
                id="mileage"
                type="number"
                placeholder="ex: 45200"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
              />
            </div>
          </div>

          {/* Barre de progression */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>{completedCount}/{items.length} éléments vérifiés</span>
              <span>{progressPct}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Éléments de la checklist */}
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div
                key={item.element}
                className="flex items-center justify-between p-3 border rounded-lg bg-background"
              >
                <div>
                  <p className="text-sm font-medium">{item.element}</p>
                  <Badge variant="outline" className="text-xs mt-1">{item.categorie}</Badge>
                </div>
                <div className="flex gap-2">
                  {(['ok', 'defect', 'repair'] as const).map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={item.status === s ? 'default' : 'outline'}
                      className={
                        item.status === s
                          ? s === 'ok' ? 'bg-green-600' : s === 'defect' ? 'bg-red-600' : 'bg-yellow-600'
                          : ''
                      }
                      onClick={() => updateItem(idx, s)}
                    >
                      {s === 'ok' ? 'OK' : s === 'defect' ? 'Défaut' : 'À réparer'}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Button
            className="w-full bg-primary hover:bg-primary/90"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enregistrement…</>
            ) : (
              <><Calendar className="w-4 h-4 mr-2" /> Enregistrer la fiche {checklistType === 'departure' ? 'de départ' : 'de retour'}</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Dialog — historique des fiches (lecture depuis Supabase) */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Fiches enregistrées</DialogTitle>
            <DialogDescription>
              Historique des checklists pour {selectedVehicleName}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Sélectionnez un véhicule puis consultez son historique dans la gestion des véhicules.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
