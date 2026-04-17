import { createClient, RealtimeChannel } from "@supabase/supabase-js";
import { Reservation } from "../types";
import { notificationService } from "./notificationService";

interface DBReservation {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  vehicle_id: string;
  vehicle_name: string;
  destination: string;
  purpose: string;
  need_driver: boolean;
  start_date: string;
  end_date: string;
  status: "pending" | "validated" | "cancelled" | "completed";
  cancel_reason: string | null;
  cancelled_by: string | null;
  validated_by: string | null;
  completed_by: string | null;
  created_at: string;
  updated_at: string;
}

class ReservationService {
  private supabase;
  private subscriptions: Map<string, RealtimeChannel> = new Map();

  constructor() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("❌ Variables d'environnement Supabase manquantes");
    }

    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log("✅ ReservationService initialisé");
  }

  /**
   * Charger toutes les réservations
   */
  async loadReservations(): Promise<Reservation[]> {
    try {
      console.log("📥 Chargement de toutes les réservations");

      const { data, error } = await this.supabase
        .from("reservations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Erreur lors du chargement des réservations:", error);
        return [];
      }

      const mapped = (data || []).map(this.mapFromDB.bind(this));
      console.log(`✅ ${mapped.length} réservations chargées`);
      return mapped;
    } catch (error) {
      console.error("❌ Exception lors du chargement des réservations:", error);
      return [];
    }
  }

  /**
   * Charger les réservations d'un utilisateur spécifique
   */
  async loadUserReservations(userId: string): Promise<Reservation[]> {
    try {
      console.log(`📥 Chargement des réservations pour l'utilisateur: ${userId}`);

      const { data, error } = await this.supabase
        .from("reservations")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Erreur lors du chargement des réservations utilisateur:", error);
        return [];
      }

      const mapped = (data || []).map(this.mapFromDB.bind(this));
      console.log(`✅ ${mapped.length} réservations chargées pour cet utilisateur`);
      return mapped;
    } catch (error) {
      console.error("❌ Exception lors du chargement des réservations utilisateur:", error);
      return [];
    }
  }

  /**
   * Créer une nouvelle réservation
   */
  async createReservation(
    reservation: Omit<Reservation, "id" | "createdAt">
  ): Promise<Reservation | null> {
    try {
      console.log("📤 Création d'une nouvelle réservation");

      // Validation basique
      if (!reservation.userId || !reservation.vehicleId) {
        console.error("❌ Données de réservation invalides");
        return null;
      }

      const dbReservation = {
        user_id: reservation.userId,
        user_name: reservation.userName,
        user_email: reservation.userEmail,
        vehicle_id: reservation.vehicleId,
        vehicle_name: reservation.vehicleName,
        destination: reservation.destination,
        purpose: reservation.purpose,
        need_driver: reservation.needDriver,
        start_date: reservation.startDate.toISOString(),
        end_date: reservation.endDate.toISOString(),
        status: reservation.status,
        cancel_reason: reservation.cancelReason || null,
        cancelled_by: reservation.cancelledBy || null,
        validated_by: reservation.validatedBy || null,
        completed_by: reservation.completedBy || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await this.supabase
        .from("reservations")
        .insert([dbReservation])
        .select()
        .single();

      if (error) {
        console.error("❌ Erreur lors de la création de la réservation:", error);
        return null;
      }

      console.log("✅ Réservation créée avec succès");
      const mappedReservation = this.mapFromDB(data);

      // Envoyer une notification au contrôleur
      try {
        await notificationService.notifyControllerNewReservation({
          vehicleName: reservation.vehicleName,
          userName: reservation.userName,
          userEmail: reservation.userEmail,
          destination: reservation.destination,
          purpose: reservation.purpose,
          needDriver: reservation.needDriver,
          startDate: reservation.startDate,
          endDate: reservation.endDate,
        });
      } catch (notificationError) {
        console.warn('⚠️ La notification n\'a pas pu être envoyée, mais la réservation a été créée:', notificationError);
      }

      return mappedReservation;
    } catch (error) {
      console.error("❌ Exception lors de la création de la réservation:", error);
      return null;
    }
  }

  /**
   * Mettre à jour une réservation
   */
  async updateReservation(
    id: string,
    updates: Partial<Omit<Reservation, "id" | "createdAt">>
  ): Promise<Reservation | null> {
    try {
      console.log(`📝 Mise à jour de la réservation: ${id}`);

      const dbUpdates: any = {
        updated_at: new Date().toISOString(),
      };

      // Mapper les champs camelCase vers snake_case
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.cancelReason !== undefined) dbUpdates.cancel_reason = updates.cancelReason;
      if (updates.cancelledBy !== undefined) dbUpdates.cancelled_by = updates.cancelledBy;
      if (updates.validatedBy !== undefined) dbUpdates.validated_by = updates.validatedBy;
      if (updates.completedBy !== undefined) dbUpdates.completed_by = updates.completedBy;

      const { data, error } = await this.supabase
        .from("reservations")
        .update(dbUpdates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("❌ Erreur lors de la mise à jour de la réservation:", error);
        return null;
      }

      console.log("✅ Réservation mise à jour");
      return this.mapFromDB(data);
    } catch (error) {
      console.error("❌ Exception lors de la mise à jour de la réservation:", error);
      return null;
    }
  }

  /**
   * Supprimer une réservation
   */
  async deleteReservation(id: string): Promise<boolean> {
    try {
      console.log(`🗑️ Suppression de la réservation: ${id}`);

      const { error } = await this.supabase
        .from("reservations")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("❌ Erreur lors de la suppression de la réservation:", error);
        return false;
      }

      console.log("✅ Réservation supprimée");
      return true;
    } catch (error) {
      console.error("❌ Exception lors de la suppression de la réservation:", error);
      return false;
    }
  }

  /**
   * S'abonner à TOUTES les réservations (INSERT, UPDATE, DELETE)
   */
  subscribeToReservations(onChanged: (reservation: Reservation, action: "created" | "updated" | "deleted") => void): () => void {
    try {
      console.log("🔄 Abonnement à toutes les réservations");

      const channel = this.supabase
        .channel("reservations:*")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "reservations",
          },
          (payload) => {
            console.log("📬 Nouvelle réservation reçue via Realtime");
            const reservation = this.mapFromDB(payload.new as DBReservation);
            onChanged(reservation, "created");
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "reservations",
          },
          (payload) => {
            console.log("📝 Réservation mise à jour via Realtime");
            const reservation = this.mapFromDB(payload.new as DBReservation);
            onChanged(reservation, "updated");
          }
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "reservations",
          },
          (payload) => {
            console.log("🗑️ Réservation supprimée via Realtime");
            const reservation = this.mapFromDB(payload.old as DBReservation);
            onChanged(reservation, "deleted");
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            console.log("✅ Souscription aux réservations établie");
          } else if (status === "CHANNEL_ERROR") {
            console.error("❌ Erreur d'abonnement aux réservations");
          }
        });

      this.subscriptions.set("reservations", channel);

      // Retourner une fonction de cleanup
      return () => {
        console.log("❌ Désinscription des réservations");
        this.supabase.removeChannel(channel);
        this.subscriptions.delete("reservations");
      };
    } catch (error) {
      console.error("❌ Exception lors de l'abonnement aux réservations:", error);
      return () => {};
    }
  }

  /**
   * S'abonner aux réservations d'un utilisateur spécifique
   */
  subscribeToUserReservations(userId: string, onChanged: (reservation: Reservation, action: "created" | "updated" | "deleted") => void): () => void {
    try {
      console.log(`🔄 Abonnement aux réservations de l'utilisateur: ${userId}`);

      const channel = this.supabase
        .channel(`reservations:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "reservations",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            if (payload.eventType === "INSERT") {
              console.log("📬 Nouvelle réservation utilisateur via Realtime");
              const reservation = this.mapFromDB(payload.new as DBReservation);
              onChanged(reservation, "created");
            } else if (payload.eventType === "UPDATE") {
              console.log("📝 Réservation utilisateur mise à jour via Realtime");
              const reservation = this.mapFromDB(payload.new as DBReservation);
              onChanged(reservation, "updated");
            } else if (payload.eventType === "DELETE") {
              console.log("🗑️ Réservation utilisateur supprimée via Realtime");
              const reservation = this.mapFromDB(payload.old as DBReservation);
              onChanged(reservation, "deleted");
            }
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            console.log("✅ Souscription aux réservations utilisateur établie");
          } else if (status === "CHANNEL_ERROR") {
            console.error("❌ Erreur d'abonnement aux réservations utilisateur");
          }
        });

      this.subscriptions.set(`user_${userId}`, channel);

      // Retourner une fonction de cleanup
      return () => {
        console.log(`❌ Désinscription des réservations de l'utilisateur: ${userId}`);
        this.supabase.removeChannel(channel);
        this.subscriptions.delete(`user_${userId}`);
      };
    } catch (error) {
      console.error("❌ Exception lors de l'abonnement aux réservations utilisateur:", error);
      return () => {};
    }
  }

  /**
   * Convertir un message de la DB au format UI
   */
  private mapFromDB(dbRes: DBReservation): Reservation {
    return {
      id: dbRes.id,
      userId: dbRes.user_id,
      userName: dbRes.user_name,
      userEmail: dbRes.user_email,
      vehicleId: dbRes.vehicle_id,
      vehicleName: dbRes.vehicle_name,
      destination: dbRes.destination,
      purpose: dbRes.purpose,
      needDriver: dbRes.need_driver,
      startDate: new Date(dbRes.start_date),
      endDate: new Date(dbRes.end_date),
      status: dbRes.status,
      cancelReason: dbRes.cancel_reason || undefined,
      cancelledBy: dbRes.cancelled_by || undefined,
      validatedBy: dbRes.validated_by || undefined,
      completedBy: dbRes.completed_by || undefined,
      createdAt: new Date(dbRes.created_at),
    };
  }

  /**
   * Nettoyer tous les abonnements
   */
  cleanup(): void {
    console.log("🧹 Nettoyage de tous les abonnements");
    this.subscriptions.forEach((channel) => {
      this.supabase.removeChannel(channel);
    });
    this.subscriptions.clear();
  }
}

export const reservationService = new ReservationService();
