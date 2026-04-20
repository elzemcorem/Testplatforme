/**
 * Service Future Bookings
 * Gère les réservations planifiées (futures bookings)
 */

import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface FutureBooking {
  id?: string;
  user_id?: string;
  vehicle_id: string;
  planned_start_date: Date;
  planned_end_date: Date;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'started' | 'completed';
  notes?: string;
}

interface CreateFutureBookingParams {
  user_id: string;
  vehicle_id: string;
  planned_start_date: Date;
  planned_end_date: Date;
  notes?: string;
}

class FutureBookingsService {
  public supabase = createClient(
    `https://${projectId}.supabase.co`,
    publicAnonKey
  );

  /**
   * Créer une réservation planifiée
   */
  async createFutureBooking(params: CreateFutureBookingParams): Promise<FutureBooking | null> {
    try {
      // Vérifier que les dates sont valides
      if (params.planned_end_date <= params.planned_start_date) {
        toast.error('La date de fin doit être après la date de début');
        return null;
      }

      // Vérifier qu'il n'y a pas de conflit
      const hasConflict = await this.checkBookingConflict(
        params.vehicle_id,
        params.planned_start_date,
        params.planned_end_date
      );

      if (hasConflict) {
        toast.error('Il existe déjà une réservation pour cette période');
        return null;
      }

      // Créer la réservation planifiée
      const { data, error } = await this.supabase
        .from('future_bookings')
        .insert([
          {
            user_id: params.user_id,
            vehicle_id: params.vehicle_id,
            planned_start_date: params.planned_start_date.toISOString(),
            planned_end_date: params.planned_end_date.toISOString(),
            status: 'pending',
            notes: params.notes || null
          }
        ])
        .select()
        .single();

      if (error) throw error;

      toast.success('Réservation planifiée créée avec succès!');
      return data;
    } catch (error) {
      console.error('Error creating future booking:', error);
      toast.error('Erreur lors de la création de la réservation');
      return null;
    }
  }

  /**
   * Vérifier les conflits de réservation
   */
  private async checkBookingConflict(
    vehicleId: string,
    startDate: Date,
    endDate: Date
  ): Promise<boolean> {
    try {
      // Vérifier dans les réservations actuelles
      const { data: existingReservations, error: reservationError } = await this.supabase
        .from('reservations')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .gte('end_date', startDate.toISOString())
        .lte('start_date', endDate.toISOString())
        .neq('status', 'cancelled');

      if (reservationError) throw reservationError;

      // Vérifier dans les futures bookings
      const { data: existingBookings, error: bookingError } = await this.supabase
        .from('future_bookings')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .gte('planned_end_date', startDate.toISOString())
        .lte('planned_start_date', endDate.toISOString())
        .neq('status', 'cancelled');

      if (bookingError) throw bookingError;

      return (existingReservations?.length || 0) > 0 || (existingBookings?.length || 0) > 0;
    } catch (error) {
      console.error('Error checking booking conflict:', error);
      return false;
    }
  }

  /**
   * Obtenir les réservations planifiées d'un utilisateur
   */
  async getUserFutureBookings(userId: string): Promise<FutureBooking[]> {
    try {
      // Requête simplifiée sans relations (PostgREST a du mal avec certaines FK)
      const { data, error } = await this.supabase
        .from('future_bookings')
        .select('*')
        .eq('user_id', userId)
        .order('planned_start_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user future bookings:', error);
      return [];
    }
  }

  /**
   * Obtenir tous les future bookings (pour DAF)
   */
  async getAllFutureBookings(): Promise<FutureBooking[]> {
    try {
      // Requête simplifiée sans relations (PostgREST a du mal avec auth.users)
      const { data, error } = await this.supabase
        .from('future_bookings')
        .select('*')
        .order('planned_start_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all future bookings:', error);
      return [];
    }
  }

  /**
   * Confirmer une réservation planifiée (convertir en réservation réelle)
   */
  async confirmFutureBooking(bookingId: string, userId: string): Promise<any | null> {
    try {
      // Récupérer le booking
      const { data: booking, error: bookingError } = await this.supabase
        .from('future_bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (bookingError) throw bookingError;

      // Créer la réservation réelle
      const { data: reservation, error: reservationError } = await this.supabase
        .from('reservations')
        .insert([
          {
            user_id: userId,
            vehicle_id: booking.vehicle_id,
            start_date: booking.planned_start_date,
            end_date: booking.planned_end_date,
            status: 'confirmed',
            notes: booking.notes
          }
        ])
        .select()
        .single();

      if (reservationError) throw reservationError;

      // Mettre à jour le statut du future booking
      const { error: updateError } = await this.supabase
        .from('future_bookings')
        .update({ status: 'confirmed' })
        .eq('id', bookingId);

      if (updateError) throw updateError;

      toast.success('Réservation planifiée confirmée!');
      return reservation;
    } catch (error) {
      console.error('Error confirming future booking:', error);
      toast.error('Erreur lors de la confirmation');
      return null;
    }
  }

  /**
   * Annuler une réservation planifiée
   */
  async cancelFutureBooking(bookingId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('future_bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;

      toast.success('Réservation planifiée annulée');
      return true;
    } catch (error) {
      console.error('Error cancelling future booking:', error);
      toast.error('Erreur lors de l\'annulation');
      return false;
    }
  }

  /**
   * Mettre à jour une réservation planifiée
   */
  async updateFutureBooking(
    bookingId: string,
    updates: Partial<FutureBooking>
  ): Promise<FutureBooking | null> {
    try {
      // Si les dates changent, vérifier les conflits
      if (updates.planned_start_date || updates.planned_end_date) {
        const { data: booking } = await this.supabase
          .from('future_bookings')
          .select('vehicle_id')
          .eq('id', bookingId)
          .single();

        if (booking) {
          const startDate = updates.planned_start_date || new Date();
          const endDate = updates.planned_end_date || new Date();
          
          const hasConflict = await this.checkBookingConflict(
            booking.vehicle_id,
            startDate,
            endDate
          );

          if (hasConflict) {
            toast.error('Il existe déjà une réservation pour cette période');
            return null;
          }
        }
      }

      const updateData: any = {};
      if (updates.planned_start_date) {
        updateData.planned_start_date = updates.planned_start_date.toISOString();
      }
      if (updates.planned_end_date) {
        updateData.planned_end_date = updates.planned_end_date.toISOString();
      }
      if (updates.notes !== undefined) {
        updateData.notes = updates.notes;
      }

      const { data, error } = await this.supabase
        .from('future_bookings')
        .update(updateData)
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;

      toast.success('Réservation planifiée mise à jour');
      return data;
    } catch (error) {
      console.error('Error updating future booking:', error);
      toast.error('Erreur lors de la mise à jour');
      return null;
    }
  }

  /**
   * Updater le statut d'une réservation future (pour contrôleurs)
   */
  async updateFutureBookingStatus(
    bookingId: string,
    status: 'confirmed' | 'cancelled'
  ): Promise<boolean> {
    try {
      console.log(`[FutureBookingsService] Updating booking ${bookingId} to status: ${status}`);

      // D'abord vérifier que le booking existe
      const { data: existingBooking, error: checkError } = await this.supabase
        .from('future_bookings')
        .select('id, status, user_id')
        .eq('id', bookingId)
        .single();

      if (checkError) {
        console.error('[FutureBookingsService] Booking not found:', checkError);
        throw new Error(`Réservation ${bookingId} non trouvée`);
      }

      if (!existingBooking) {
        throw new Error(`Réservation ${bookingId} n'existe pas`);
      }

      console.log('[FutureBookingsService] Booking found:', existingBooking);

      // Ensuite mettre à jour le statut
      const { data, error } = await this.supabase
        .from('future_bookings')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', bookingId);

      if (error) {
        console.error('[FutureBookingsService] Update error:', error);
        // PGRST116 = RLS policy bloque l'accès
        if (error.code === 'PGRST116') {
          throw new Error('Vous n\'avez pas les droits pour mettre à jour cette réservation. Vérifiez que vous êtes contrôleur et que les RLS policies sont correctes.');
        }
        throw error;
      }

      console.log('[FutureBookingsService] Update successful');
      toast.success(status === 'confirmed' ? '✅ Réservation validée' : '❌ Réservation annulée');
      return true;
    } catch (error) {
      console.error('[FutureBookingsService] Error updating booking status:', error);
      const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
      
      // Message d'erreur différencié selon le type d'erreur
      if (errorMsg.includes('RLS')) {
        toast.error(`❌ ${errorMsg}\n💡 Exécutez FIX_RLS_ROLE_CHECK.sql dans Supabase`);
      } else if (errorMsg.includes('n\'existe pas')) {
        toast.error(`❌ Réservation non trouvée`);
      } else {
        toast.error(`❌ Erreur: ${errorMsg}`);
      }
      return false;
    }
  }

  /**
   * Obtenir la disponibilité d'un véhicule pour une période
   */
  async getVehicleAvailability(
    vehicleId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ available: boolean; reason?: string }> {
    try {
      // Vérifier les réservations
      const { data: reservations } = await this.supabase
        .from('reservations')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .gte('end_date', startDate.toISOString())
        .lte('start_date', endDate.toISOString())
        .neq('status', 'cancelled');

      if ((reservations?.length || 0) > 0) {
        return { available: false, reason: 'Réservation existante' };
      }

      // Vérifier les future bookings
      const { data: bookings } = await this.supabase
        .from('future_bookings')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .gte('planned_end_date', startDate.toISOString())
        .lte('planned_start_date', endDate.toISOString())
        .neq('status', 'cancelled');

      if ((bookings?.length || 0) > 0) {
        return { available: false, reason: 'Réservation planifiée existante' };
      }

      return { available: true };
    } catch (error) {
      console.error('Error checking vehicle availability:', error);
      return { available: false, reason: 'Erreur de vérification' };
    }
  }
}

export const futureBookingsService = new FutureBookingsService();
