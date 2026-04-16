import { useState } from "react";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "./ui/utils";

interface DateTimePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  placeholder?: string;
}

export function DateTimePicker({ date, setDate, placeholder = "Choisir une date" }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
  const minutes = ["00", "15", "30", "45"];

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      // Créer une nouvelle date pour éviter les problèmes de mutation
      const newDate = new Date(selectedDate);
      
      // Préserver l'heure si elle existe déjà
      if (date) {
        newDate.setHours(date.getHours());
        newDate.setMinutes(date.getMinutes());
      } else {
        newDate.setHours(8); // Heure par défaut : 8h00
        newDate.setMinutes(0);
      }
      setDate(newDate);
    }
  };

  const handleHourChange = (hour: string) => {
    const newDate = date ? new Date(date) : new Date();
    newDate.setHours(parseInt(hour));
    setDate(newDate);
  };

  const handleMinuteChange = (minute: string) => {
    const newDate = date ? new Date(date) : new Date();
    newDate.setMinutes(parseInt(minute));
    setDate(newDate);
  };

  // Obtenir la minute la plus proche de 15 minutes
  const getCurrentMinutes = () => {
    if (!date) return "00";
    const mins = date.getMinutes();
    const rounded = Math.round(mins / 15) * 15;
    return (rounded % 60).toString().padStart(2, "0");
  };

  // Obtenir les heures actuelles
  const getCurrentHours = () => {
    if (!date) return "08";
    return date.getHours().toString().padStart(2, "0");
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            format(date, "PPP 'à' HH:mm", { locale: fr })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-[9999]" align="start" sideOffset={4}>
        <div className="p-3">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
            disabled={(calendarDate) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return calendarDate < today;
            }}
          />
          
          {/* Sélecteur d'heure */}
          <div className="border-t pt-3 mt-3">
            <div className="text-sm font-medium mb-2">Heure</div>
            <div className="flex gap-2">
              <Select
                value={getCurrentHours()}
                onValueChange={handleHourChange}
              >
                <SelectTrigger className="w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-[200px] z-[99999]">
                  {hours.map((hour) => (
                    <SelectItem key={hour} value={hour}>
                      {hour}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <span className="flex items-center">:</span>
              
              <Select
                value={getCurrentMinutes()}
                onValueChange={handleMinuteChange}
              >
                <SelectTrigger className="w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[99999]">
                  {minutes.map((minute) => (
                    <SelectItem key={minute} value={minute}>
                      {minute}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            className="w-full mt-3 bg-primary hover:bg-primary/90"
            onClick={() => setIsOpen(false)}
          >
            Valider
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}