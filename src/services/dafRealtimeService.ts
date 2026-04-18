/**
 * Service DAF Realtime
 * Gère les connexions WebSocket et les notifications en temps réel pour le DAF
 */

import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export interface ControllerAction {
  id: string;
  controller_id: string;
  reservation_id: string;
  action_type: 'validated' | 'cancelled' | 'modified';
  old_status: string;
  new_status: string;
  reason: string | null;
  timestamp: string;
}

export interface FutureBooking {
  id: string;
  user_id: string;
  vehicle_id: string;
  planned_start_date: string;
  planned_end_date: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'started' | 'completed';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DAFNotification {
  id: string;
  type: 'action' | 'booking' | 'alert';
  title: string;
  message: string;
  action?: ControllerAction;
  booking?: FutureBooking;
  timestamp: string;
  read: boolean;
}

class DAFRealtimeService {
  private supabase = createClient(
    `https://${projectId}.supabase.co`,
    publicAnonKey
  );
  private subscriptions: any[] = [];
  private notificationHandlers: ((notification: DAFNotification) => void)[] = [];

  /**
   * Initialiser les souscriptions Realtime pour le DAF
   */
  initializeRealtimeListeners(): void {
    // Écouter les actions du contrôleur
    this.subscribeToControllerActions();
    
    // Écouter les nouvelles réservations planifiées
    this.subscribeToFutureBookings();
    
    // Écouter les changements de statut des réservations
    this.subscribeToReservationChanges();
  }

  /**
   * S'abonner aux actions du contrôleur
   */
  private subscribeToControllerActions(): void {
    const subscription = this.supabase
      .channel('controller_actions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'controller_actions_log'
        },
        (payload) => {
          const action = payload.new as ControllerAction;
          this.handleControllerAction(action);
        }
      )
      .subscribe();

    this.subscriptions.push(subscription);
  }

  /**
   * S'abonner aux futures bookings
   */
  private subscribeToFutureBookings(): void {
    const subscription = this.supabase
      .channel('future_bookings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'future_bookings'
        },
        (payload) => {
          const booking = payload.new as FutureBooking;
          this.handleFutureBooking(payload.eventType, booking);
        }
      )
      .subscribe();

    this.subscriptions.push(subscription);
  }

  /**
   * S'abonner aux changements des réservations
   */
  private subscribeToReservationChanges(): void {
    const subscription = this.supabase
      .channel('reservations_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'reservations'
        },
        (payload) => {
          const oldStatus = payload.old.status;
          const newStatus = payload.new.status;
          
          if (oldStatus !== newStatus) {
            this.handleReservationStatusChange(payload.new, oldStatus, newStatus);
          }
        }
      )
      .subscribe();

    this.subscriptions.push(subscription);
  }

  /**
   * Gérer une action du contrôleur
   */
  private handleControllerAction(action: ControllerAction): void {
    const actionLabel = {
      validated: '✅ Validée',
      cancelled: '❌ Annulée',
      modified: '📝 Modifiée'
    };

    const notification: DAFNotification = {
      id: action.id,
      type: 'action',
      title: `Réservation ${actionLabel[action.action_type]}`,
      message: `Contrôleur a ${actionLabel[action.action_type].toLowerCase()} une réservation (${action.old_status} → ${action.new_status})`,
      action,
      timestamp: action.timestamp,
      read: false
    };

    this.broadcastNotification(notification);
  }

  /**
   * Gérer une future booking
   */
  private handleFutureBooking(eventType: string, booking: FutureBooking): void {
    let title = '';
    let message = '';

    if (eventType === 'INSERT') {
      title = '📅 Nouvelle réservation planifiée';
      message = `Une réservation a été planifiée pour ${new Date(booking.planned_start_date).toLocaleDateString()}`;
    } else if (eventType === 'UPDATE') {
      title = '📝 Réservation planifiée modifiée';
      message = `Une réservation planifiée a été mise à jour`;
    } else if (eventType === 'DELETE') {
      title = '🗑️ Réservation planifiée supprimée';
      message = `Une réservation planifiée a été supprimée`;
    }

    const notification: DAFNotification = {
      id: booking.id,
      type: 'booking',
      title,
      message,
      booking,
      timestamp: new Date().toISOString(),
      read: false
    };

    this.broadcastNotification(notification);
  }

  /**
   * Gérer un changement de statut de réservation
   */
  private handleReservationStatusChange(reservation: any, oldStatus: string, newStatus: string): void {
    const notification: DAFNotification = {
      id: reservation.id,
      type: 'alert',
      title: `⚠️ Changement de statut`,
      message: `Réservation: ${oldStatus} → ${newStatus}`,
      timestamp: new Date().toISOString(),
      read: false
    };

    this.broadcastNotification(notification);
  }

  /**
   * Enregistrer un handler de notification
   */
  onNotification(handler: (notification: DAFNotification) => void): void {
    this.notificationHandlers.push(handler);
  }

  /**
   * Supprimer un handler de notification
   */
  offNotification(handler: (notification: DAFNotification) => void): void {
    this.notificationHandlers = this.notificationHandlers.filter(h => h !== handler);
  }

  /**
   * Diffuser une notification à tous les handlers
   */
  private broadcastNotification(notification: DAFNotification): void {
    this.notificationHandlers.forEach(handler => handler(notification));
  }

  /**
   * Charger l'historique des actions du contrôleur
   */
  async getControllerActionsHistory(limit: number = 50): Promise<ControllerAction[]> {
    try {
      const { data, error } = await this.supabase
        .from('controller_actions_log')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching controller actions:', error);
      return [];
    }
  }

  /**
   * Charger les future bookings
   */
  async getFutureBookings(status?: string): Promise<FutureBooking[]> {
    try {
      let query = this.supabase.from('future_bookings').select('*');
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query
        .order('planned_start_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching future bookings:', error);
      return [];
    }
  }

  /**
   * Nettoyer les souscriptions
   */
  unsubscribeAll(): void {
    this.subscriptions.forEach(sub => {
      this.supabase.removeChannel(sub);
    });
    this.subscriptions = [];
    this.notificationHandlers = [];
  }
}

export const dafRealtimeService = new DAFRealtimeService();
