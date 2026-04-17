import { useState, useEffect, useRef } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Plus, Edit, Trash2, Car, Upload, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { vehicleService, Vehicle as VehicleType } from "../services/vehicleService";

interface Vehicle {
  id: string;
  name: string;
  type: string;
  capacity: number;
  fuelType: string;
  imageUrl?: string;
  imageData?: string;
}

export function VehicleConfiguration() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    capacity: "",
    fuelType: "",
    imageData: "",
  });

  // 📥 Charger les véhicules depuis Supabase et s'abonner aux mises à jour
  useEffect(() => {
    const loadAndSubscribe = async () => {
      try {
        // Charger les données initiales
        const loaded = await vehicleService.loadVehicles();
        const mappedVehicles: Vehicle[] = loaded.map((v: VehicleType) => ({
          id: v.id,
          name: v.name,
          type: v.type,
          capacity: v.capacity,
          fuelType: v.fuel_type,
          imageData: v.image_data,
        }));
        setVehicles(mappedVehicles);
        console.log("✅ Véhicules chargés:", mappedVehicles.length);

        // S'abonner aux changements en temps réel
        const unsubscribe = vehicleService.subscribeToVehicles(
          (vehicle: VehicleType, action) => {
            console.log(`📡 Véhicule ${action}:`, vehicle.name);
            const mappedVehicle: Vehicle = {
              id: vehicle.id,
              name: vehicle.name,
              type: vehicle.type,
              capacity: vehicle.capacity,
              fuelType: vehicle.fuel_type,
              imageData: vehicle.image_data,
            };

            setVehicles((prev) => {
              if (action === "created") {
                if (prev.some((v) => v.id === vehicle.id)) {
                  return prev;
                }
                return [mappedVehicle, ...prev];
              } else if (action === "updated") {
                return prev.map((v) =>
                  v.id === vehicle.id ? mappedVehicle : v
                );
              } else if (action === "deleted") {
                return prev.filter((v) => v.id !== vehicle.id);
              }
              return prev;
            });
          }
        );

        unsubscribeRef.current = unsubscribe;
      } catch (error) {
        console.error("❌ Erreur lors du chargement:", error);
        toast.error("Erreur lors du chargement des véhicules");
      } finally {
        setIsLoading(false);
      }
    };

    loadAndSubscribe();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier la taille (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("L'image ne doit pas dépasser 2 MB");
        return;
      }

      // Vérifier le type
      if (!file.type.startsWith("image/")) {
        toast.error("Le fichier doit être une image");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageData: reader.result as string });
        toast.success("Image chargée avec succès");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdd = async () => {
    if (!formData.name || !formData.type || !formData.capacity || !formData.fuelType) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    try {
      const created = await vehicleService.createVehicle({
        name: formData.name,
        type: formData.type,
        capacity: parseInt(formData.capacity),
        fuel_type: formData.fuelType,
        image_data: formData.imageData || undefined,
      });

      if (created) {
        // Ajouter à l'état directement
        const newVehicle: Vehicle = {
          id: created.id,
          name: created.name,
          type: created.type,
          capacity: created.capacity,
          fuelType: created.fuel_type,
          imageData: created.image_data,
        };
        setVehicles((prev) => [newVehicle, ...prev]);

        toast.success(`Véhicule "${formData.name}" ajouté avec succès`);
        setIsAddDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout:", error);
      toast.error("Erreur lors de l'ajout du véhicule");
    }
  };

  const handleEdit = async () => {
    if (!selectedVehicle) return;

    if (!formData.name || !formData.type || !formData.capacity || !formData.fuelType) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    try {
      const updated = await vehicleService.updateVehicle(selectedVehicle.id, {
        name: formData.name,
        type: formData.type,
        capacity: parseInt(formData.capacity),
        fuel_type: formData.fuelType,
        image_data: formData.imageData || selectedVehicle.imageData,
      });

      if (updated) {
        // Mettre à jour l'état directement
        setVehicles((prev) =>
          prev.map((v) =>
            v.id === selectedVehicle.id
              ? {
                  ...v,
                  name: formData.name,
                  type: formData.type,
                  capacity: parseInt(formData.capacity),
                  fuelType: formData.fuelType,
                  imageData: formData.imageData || selectedVehicle.imageData,
                }
              : v
          )
        );
        
        toast.success(`Véhicule "${formData.name}" modifié avec succès`);
        setIsEditDialogOpen(false);
        setSelectedVehicle(null);
        resetForm();
      }
    } catch (error) {
      console.error("Erreur lors de la modification:", error);
      toast.error("Erreur lors de la modification du véhicule");
    }
  };

  const handleDelete = async (vehicle: Vehicle) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${vehicle.name}" ?`)) {
      try {
        const deleted = await vehicleService.deleteVehicle(vehicle.id);
        if (deleted) {
          // Retirer de l'état directement
          setVehicles((prev) => prev.filter((v) => v.id !== vehicle.id));
          toast.success(`Véhicule "${vehicle.name}" supprimé avec succès`);
        }
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        toast.error("Erreur lors de la suppression du véhicule");
      }
    }
  };

  const openEditDialog = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setFormData({
      name: vehicle.name,
      type: vehicle.type,
      capacity: vehicle.capacity.toString(),
      fuelType: vehicle.fuelType,
      imageData: vehicle.imageData || "",
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "",
      capacity: "",
      fuelType: "",
      imageData: "",
    });
  };

  return (
    <div className="p-6 space-y-6 bg-background min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Configuration des Véhicules</h1>
          <p className="text-muted-foreground mt-1">
            Gérez le parc automobile de Bénin Petro
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsAddDialogOpen(true);
          }}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un véhicule
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de véhicules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{vehicles.length}</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Berlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-500">
              {vehicles.filter((v) => v.type === "Berline").length}
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              SUV
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-500">
              {vehicles.filter((v) => v.type === "SUV").length}
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-yellow-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Minibus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-500">
              {vehicles.filter((v) => v.type === "Minibus").length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des véhicules */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle>Liste des Véhicules</CardTitle>
          <CardDescription>Tous les véhicules disponibles dans la flotte</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map((vehicle) => (
              <Card key={vehicle.id} className="border-2 border-primary/10 overflow-hidden">
                <CardContent className="p-0">
                  {/* Image du véhicule */}
                  {vehicle.imageData ? (
                    <div className="h-48 bg-gray-200 dark:bg-gray-800 overflow-hidden">
                      <img
                        src={vehicle.imageData}
                        alt={vehicle.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <Car className="w-24 h-24 text-primary/40" />
                    </div>
                  )}

                  {/* Informations */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg">{vehicle.name}</h3>
                      <p className="text-sm text-muted-foreground">{vehicle.type}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Capacité</p>
                        <p className="font-medium">{vehicle.capacity} places</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Carburant</p>
                        <p className="font-medium">{vehicle.fuelType}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openEditDialog(vehicle)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Modifier
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDelete(vehicle)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {vehicles.length === 0 && (
            <div className="text-center py-12">
              <Car className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Aucun véhicule</h3>
              <p className="text-muted-foreground mb-4">
                Commencez par ajouter votre premier véhicule
              </p>
              <Button
                onClick={() => {
                  resetForm();
                  setIsAddDialogOpen(true);
                }}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un véhicule
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Ajout */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter un véhicule</DialogTitle>
            <DialogDescription>
              Ajoutez un nouveau véhicule à la flotte de Bénin Petro
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Image */}
            <div className="space-y-2">
              <Label htmlFor="add-image">Image du véhicule</Label>
              <div className="space-y-2">
                {formData.imageData ? (
                  <div className="relative">
                    <img
                      src={formData.imageData}
                      alt="Aperçu"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setFormData({ ...formData, imageData: "" })}
                    >
                      Supprimer
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Cliquez pour charger une image
                    </p>
                    <Input
                      id="add-image"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("add-image")?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Charger une image
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Nom */}
            <div className="space-y-2">
              <Label htmlFor="add-name">Nom du véhicule *</Label>
              <Input
                id="add-name"
                placeholder="Ex: Toyota Corolla"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="add-type">Type *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger id="add-type">
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Berline">Berline</SelectItem>
                  <SelectItem value="SUV">SUV</SelectItem>
                  <SelectItem value="Minibus">Minibus</SelectItem>
                  <SelectItem value="Pick-up">Pick-up</SelectItem>
                  <SelectItem value="Camion">Camion</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Capacité */}
            <div className="space-y-2">
              <Label htmlFor="add-capacity">Capacité (places) *</Label>
              <Input
                id="add-capacity"
                type="number"
                min="1"
                placeholder="Ex: 5"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              />
            </div>

            {/* Carburant */}
            <div className="space-y-2">
              <Label htmlFor="add-fuel">Type de carburant *</Label>
              <Select value={formData.fuelType} onValueChange={(value) => setFormData({ ...formData, fuelType: value })}>
                <SelectTrigger id="add-fuel">
                  <SelectValue placeholder="Sélectionner un carburant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Essence">Essence</SelectItem>
                  <SelectItem value="Diesel">Diesel</SelectItem>
                  <SelectItem value="Électrique">Électrique</SelectItem>
                  <SelectItem value="Hybride">Hybride</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAdd} className="bg-primary hover:bg-primary/90">
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Modification */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le véhicule</DialogTitle>
            <DialogDescription>
              Modifiez les informations du véhicule
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Image */}
            <div className="space-y-2">
              <Label htmlFor="edit-image">Image du véhicule</Label>
              <div className="space-y-2">
                {formData.imageData ? (
                  <div className="relative">
                    <img
                      src={formData.imageData}
                      alt="Aperçu"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setFormData({ ...formData, imageData: "" })}
                    >
                      Supprimer
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Cliquez pour charger une image
                    </p>
                    <Input
                      id="edit-image"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("edit-image")?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Charger une image
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Nom */}
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nom du véhicule *</Label>
              <Input
                id="edit-name"
                placeholder="Ex: Toyota Corolla"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="edit-type">Type *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger id="edit-type">
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Berline">Berline</SelectItem>
                  <SelectItem value="SUV">SUV</SelectItem>
                  <SelectItem value="Minibus">Minibus</SelectItem>
                  <SelectItem value="Pick-up">Pick-up</SelectItem>
                  <SelectItem value="Camion">Camion</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Capacité */}
            <div className="space-y-2">
              <Label htmlFor="edit-capacity">Capacité (places) *</Label>
              <Input
                id="edit-capacity"
                type="number"
                min="1"
                placeholder="Ex: 5"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              />
            </div>

            {/* Carburant */}
            <div className="space-y-2">
              <Label htmlFor="edit-fuel">Type de carburant *</Label>
              <Select value={formData.fuelType} onValueChange={(value) => setFormData({ ...formData, fuelType: value })}>
                <SelectTrigger id="edit-fuel">
                  <SelectValue placeholder="Sélectionner un carburant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Essence">Essence</SelectItem>
                  <SelectItem value="Diesel">Diesel</SelectItem>
                  <SelectItem value="Électrique">Électrique</SelectItem>
                  <SelectItem value="Hybride">Hybride</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleEdit} className="bg-primary hover:bg-primary/90">
              Modifier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
