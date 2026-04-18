/**
 * DAF Notification Panel
 * Affiche les notifications en temps réel pour le DAF
 */

import { useEffect, useState } from 'react';
import { toast } from 'sonner@2.0.3';
import { dafRealtimeService, type DAFNotification, type ControllerAction } from '../services/dafRealtimeService';
import { AlertCircle, CheckCircle2, Clock, MessageSquare } from 'lucide-react';

interface DAFNotificationPanelProps {
  isDAF: boolean;
}

export function DAFNotificationPanel({ isDAF }: DAFNotificationPanelProps) {
  const [notifications, setNotifications] = useState<DAFNotification[]>([]);

  useEffect(() => {
    if (!isDAF) return;

    // Initialiser les listeners realtime
    dafRealtimeService.initializeRealtimeListeners();

    // Enregistrer le handler de notification
    const handleNotification = (notification: DAFNotification) => {
      setNotifications(prev => [notification, ...prev].slice(0, 50));

      // Afficher le toast
      const icon = notification.type === 'action' ? (
        <CheckCircle2 className="w-5 h-5 text-green-500" />
      ) : notification.type === 'booking' ? (
        <Clock className="w-5 h-5 text-blue-500" />
      ) : (
        <AlertCircle className="w-5 h-5 text-yellow-500" />
      );

      toast(notification.title, {
        description: notification.message,
        icon,
        duration: 10000
      });
    };

    dafRealtimeService.onNotification(handleNotification);

    // Charger l'historique initial
    loadInitialHistory();

    // Cleanup
    return () => {
      dafRealtimeService.offNotification(handleNotification);
      dafRealtimeService.unsubscribeAll();
    };
  }, [isDAF]);

  const loadInitialHistory = async () => {
    const actions = await dafRealtimeService.getControllerActionsHistory(10);
    const convertedNotifications: DAFNotification[] = actions.map(action => ({
      id: action.id,
      type: 'action',
      title: `Réservation ${action.action_type === 'validated' ? '✅ Validée' : action.action_type === 'cancelled' ? '❌ Annulée' : '📝 Modifiée'}`,
      message: `Contrôleur a ${action.action_type === 'validated' ? 'validé' : action.action_type === 'cancelled' ? 'annulé' : 'modifié'} une réservation`,
      action,
      timestamp: action.timestamp,
      read: true
    }));
    setNotifications(convertedNotifications);
  };

  if (!isDAF) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      {/* Les notifications sont affichées via les toasts Sonner */}
    </div>
  );
}
