import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Car, Users, Fuel, Gauge } from "lucide-react";

interface VehicleCardProps {
  id: string;
  name: string;
  type: string;
  capacity: number;
  fuelType: string;
  available: boolean;
  imageUrl?: string;
  imageData?: string;
  onReserve: (vehicleId: string, vehicleName: string) => void;
}

export function VehicleCard({
  id,
  name,
  type,
  capacity,
  fuelType,
  available,
  imageUrl,
  imageData,
  onReserve,
}: VehicleCardProps) {
  const displayImage = imageData || imageUrl;
  
  return (
    <Card className="overflow-hidden border-2 border-primary/20 hover:border-primary/40 transition-all duration-300">
      <div className="relative h-48 bg-gradient-to-br from-primary/5 to-primary/10">
        {displayImage ? (
          <img src={displayImage} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Car className="w-20 h-20 text-primary/30" />
          </div>
        )}
        <div className="absolute top-4 right-4">
          <Badge className={available ? "bg-green-500 text-white" : "bg-red-500 text-white"}>
            {available ? "Disponible" : "Réservé"}
          </Badge>
        </div>
      </div>
      
      <div className="p-5 space-y-4">
        <div>
          <h3 className="font-semibold text-lg">{name}</h3>
          <p className="text-sm text-muted-foreground">{type}</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm">{capacity}</span>
          </div>
          <div className="flex items-center gap-2">
            <Fuel className="w-4 h-4 text-primary" />
            <span className="text-xs">{fuelType}</span>
          </div>
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-primary" />
            <span className="text-xs">Auto</span>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t">
          <Button 
            className="bg-primary hover:bg-primary/90 w-full"
            disabled={!available}
            onClick={() => onReserve(id, name)}
          >
            Réserver
          </Button>
        </div>
      </div>
    </Card>
  );
}