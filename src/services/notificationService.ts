import { supabase } from '../utils/supabase/client';

export const notificationService = {
  /**
   * 📧 Envoyer une notification email au contrôleur quand une réservation est créée
   */
  async notifyControllerNewReservation(reservationData: {
    vehicleName: string;
    userName: string;
    userEmail: string;
    destination: string;
    purpose: string;
    needDriver: boolean;
    startDate: Date;
    endDate: Date;
  }): Promise<boolean> {
    try {
      console.log('📧 Envoi de notification email au contrôleur...');

      // Appeler une fonction Supabase (à créer dans Supabase)
      const { data, error } = await supabase.functions.invoke(
        'send-reservation-notification',
        {
          body: {
            vehicleName: reservationData.vehicleName,
            userName: reservationData.userName,
            userEmail: reservationData.userEmail,
            destination: reservationData.destination,
            purpose: reservationData.purpose,
            needDriver: reservationData.needDriver,
            startDate: reservationData.startDate.toISOString(),
            endDate: reservationData.endDate.toISOString(),
          },
        }
      );

      if (error) {
        console.error('❌ Erreur lors de l\'envoi de la notification:', error);
        return false;
      }

      console.log('✅ Notification email envoyée au contrôleur');
      return true;
    } catch (error) {
      console.error('❌ Exception lors de l\'envoi de la notification:', error);
      // Continuer même si l'email échoue (ne pas bloquer la réservation)
      return false;
    }
  },

  /**
   * 📌 Créer une notification locale en base de données (fallback)
   */
  async createLocalNotification(
    controllerId: string,
    reservationId: string,
    message: string
  ): Promise<boolean> {
    try {
      console.log('📌 Créer une notification locale...');

      const { error } = await supabase
        .from('notifications')
        .insert([
          {
            user_id: controllerId,
            reservation_id: reservationId,
            message,
            is_read: false,
            created_at: new Date().toISOString(),
          },
        ]);

      if (error) {
        console.error('❌ Erreur lors de la création de la notification:', error);
        return false;
      }

      console.log('✅ Notification locale créée');
      return true;
    } catch (error) {
      console.error('❌ Exception:', error);
      return false;
    }
  },
};
