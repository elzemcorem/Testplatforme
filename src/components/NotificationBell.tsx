import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { useAuth } from "../contexts/AuthContext";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Notification {
  id: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type: "reservation" | "general";
}

export function NotificationBell() {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const previousReservationCount = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Créer l'élément audio pour le son de notification
  useEffect(() => {
    // Créer un son de cloche simple en utilisant l'API Web Audio
    const context = new AudioContext();
    
    const playBellSound = () => {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      // Configuration pour un son de cloche
      oscillator.frequency.setValueAtTime(800, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, context.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);
      
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.5);
      
      // Deuxième note pour l'effet de cloche
      setTimeout(() => {
        const oscillator2 = context.createOscillator();
        const gainNode2 = context.createGain();
        
        oscillator2.connect(gainNode2);
        gainNode2.connect(context.destination);
        
        oscillator2.frequency.setValueAtTime(600, context.currentTime);
        oscillator2.frequency.exponentialRampToValueAtTime(300, context.currentTime + 0.1);
        
        gainNode2.gain.setValueAtTime(0.2, context.currentTime);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.4);
        
        oscillator2.start(context.currentTime);
        oscillator2.stop(context.currentTime + 0.4);
      }, 100);
    };

    audioRef.current = { play: playBellSound } as any;
  }, []);

  useEffect(() => {
    // Seuls les admins et contrôleurs reçoivent des notifications
    if (currentUser?.role !== "admin" && currentUser?.role !== "controller") {
      return;
    }

    // Charger les notifications existantes
    loadNotifications();

    // Vérifier les nouvelles réservations toutes les 2 secondes
    const interval = setInterval(() => {
      checkForNewReservations();
    }, 2000);

    return () => clearInterval(interval);
  }, [currentUser]);

  const loadNotifications = () => {
    const stored = localStorage.getItem(`notifications_${currentUser?.id}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const notificationsWithDates = parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }));
        setNotifications(notificationsWithDates);
        updateUnreadCount(notificationsWithDates);
      } catch (error) {
        console.error("Error loading notifications:", error);
      }
    }
  };

  const checkForNewReservations = () => {
    const stored = localStorage.getItem("reservations");
    if (!stored) return;

    try {
      const reservations = JSON.parse(stored);
      const currentCount = reservations.length;

      // Si on a plus de réservations qu'avant, créer une notification
      if (currentCount > previousReservationCount.current && previousReservationCount.current > 0) {
        const newReservation = reservations[reservations.length - 1];
        
        const newNotification: Notification = {
          id: `notif_${Date.now()}`,
          message: `Nouvelle réservation de ${newReservation.userName} pour ${newReservation.vehicleName}`,
          timestamp: new Date(),
          read: false,
          type: "reservation",
        };

        const updatedNotifications = [newNotification, ...notifications];
        setNotifications(updatedNotifications);
        saveNotifications(updatedNotifications);
        updateUnreadCount(updatedNotifications);

        // Jouer le son de notification
        if (audioRef.current?.play) {
          audioRef.current.play();
        }
      }

      previousReservationCount.current = currentCount;
    } catch (error) {
      console.error("Error checking reservations:", error);
    }
  };

  const saveNotifications = (notifs: Notification[]) => {
    localStorage.setItem(`notifications_${currentUser?.id}`, JSON.stringify(notifs));
  };

  const updateUnreadCount = (notifs: Notification[]) => {
    const count = notifs.filter((n) => !n.read).length;
    setUnreadCount(count);
  };

  const markAsRead = (notificationId: string) => {
    const updated = notifications.map((n) =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    setNotifications(updated);
    saveNotifications(updated);
    updateUnreadCount(updated);
  };

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    saveNotifications(updated);
    updateUnreadCount(updated);
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem(`notifications_${currentUser?.id}`);
  };

  // Ne rien afficher pour les utilisateurs normaux
  if (currentUser?.role !== "admin" && currentUser?.role !== "controller") {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-primary/10"
        >
          <Bell className="w-5 h-5 text-foreground" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs animate-pulse"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {notifications.length > 0 && (
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={markAllAsRead}
                >
                  Tout marquer lu
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-red-500 hover:text-red-600"
                onClick={clearAll}
              >
                Effacer tout
              </Button>
            </div>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucune notification</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-accent/50 cursor-pointer transition-colors ${
                    !notification.read ? "bg-primary/5" : ""
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {notification.type === "reservation" ? (
                        <div className="w-2 h-2 bg-primary rounded-full" />
                      ) : (
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notification.read ? "font-semibold" : ""}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(notification.timestamp, "PPP à p", { locale: fr })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
