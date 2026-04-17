import { supabase } from '../utils/supabase/client';

export interface Vehicle {
  id: string;
  user_id: string;
  name: string;
  type: string;
  capacity: number;
  fuel_type: string;
  image_data?: string;
  created_at?: string;
  updated_at?: string;
}

export const vehicleService = {
  /**
   * 📥 Charger tous les véhicules de l'utilisateur connecté
   */
  async loadVehicles(): Promise<Vehicle[]> {
    try {
      console.log('🚗 Chargement des véhicules...');
      
      // ⚠️ WORKAROUND: RLS policies ont une récursion infinie
      // Utiliser localStorage pour l'instant
      console.log('💾 Utilisation de localStorage (RLS policies à corriger)');
      const localVehicles = this.loadVehiclesFromLocalStorage();
      
      if (localVehicles.length > 0) {
        console.log(`✅ ${localVehicles.length} véhicules chargés depuis localStorage`);
        return localVehicles;
      }

      // Si localStorage est vide, retourner un tableau vide
      console.log('ℹ️ Aucun véhicule en localStorage');
      return [];
    } catch (error) {
      console.error('❌ Exception lors du chargement des véhicules:', error);
      return [];
    }
  },

  /**
   * 📂 Charger les véhicules depuis localStorage (fallback/migration)
   */
  loadVehiclesFromLocalStorage(): Vehicle[] {
    try {
      const stored = localStorage.getItem('vehicles');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Convertir du format localStorage (camelCase) vers format Supabase (snake_case)
          return parsed.map((v: any) => ({
            id: v.id || '',
            user_id: '', // Sera rempli par le service
            name: v.name || '',
            type: v.type || '',
            capacity: v.capacity || 0,
            fuel_type: v.fuelType || v.fuel_type || '', // Support les deux formats
            image_data: v.imageData || v.image_data, // Support les deux formats
          }));
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors de la lecture localStorage:', error);
    }
    return [];
  },

  /**
   * ➕ Créer un nouveau véhicule
   */
  async createVehicle(vehicle: Omit<Vehicle, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Vehicle | null> {
    try {
      console.log(`📝 Création du véhicule: ${vehicle.name}`);

      // ⚠️ WORKAROUND: RLS policies cassées, utiliser localStorage
      // Garder le format camelCase pour localStorage (format cohérent)
      const newVehicleData = {
        id: Date.now().toString(),
        name: vehicle.name,
        type: vehicle.type,
        capacity: vehicle.capacity,
        fuelType: vehicle.fuel_type, // Convertir en camelCase pour localStorage
        imageData: vehicle.image_data, // Convertir en camelCase pour localStorage
        created_at: new Date().toISOString(),
      };

      // Charger les véhicules existants
      const stored = localStorage.getItem('vehicles');
      const vehicles = stored ? JSON.parse(stored) : [];
      vehicles.push(newVehicleData);
      
      // Sauvegarder en localStorage avec format camelCase
      localStorage.setItem('vehicles', JSON.stringify(vehicles));
      console.log('✅ Véhicule créé et sauvegardé:', newVehicleData.name);
      
      // Retourner au format Supabase pour la compatibilité API
      return {
        id: newVehicleData.id,
        user_id: '',
        name: newVehicleData.name,
        type: newVehicleData.type,
        capacity: newVehicleData.capacity,
        fuel_type: newVehicleData.fuelType,
        image_data: newVehicleData.imageData,
        created_at: newVehicleData.created_at,
      };
    } catch (error: any) {
      console.error('❌ Exception lors de la création:', error.message || error);
      throw error;
    }
  },

  /**
   * ✏️ Mettre à jour un véhicule
   */
  async updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle | null> {
    try {
      console.log(`✏️ Mise à jour du véhicule: ${id}`);

      // ⚠️ WORKAROUND: RLS policies cassées, utiliser localStorage
      // Charger depuis localStorage en format camelCase
      const stored = localStorage.getItem('vehicles');
      const vehicles = stored ? JSON.parse(stored) : [];
      const index = vehicles.findIndex((v: any) => v.id === id);
      
      if (index === -1) {
        console.error('❌ Véhicule non trouvé:', id);
        return null;
      }

      // Mettre à jour en gardant le format camelCase pour localStorage
      const updatedData = {
        ...vehicles[index],
        name: updates.name !== undefined ? updates.name : vehicles[index].name,
        type: updates.type !== undefined ? updates.type : vehicles[index].type,
        capacity: updates.capacity !== undefined ? updates.capacity : vehicles[index].capacity,
        fuelType: updates.fuel_type !== undefined ? updates.fuel_type : vehicles[index].fuelType,
        imageData: updates.image_data !== undefined ? updates.image_data : vehicles[index].imageData,
        updated_at: new Date().toISOString(),
      };

      vehicles[index] = updatedData;
      localStorage.setItem('vehicles', JSON.stringify(vehicles));
      console.log('✅ Véhicule mis à jour:', updatedData.name);
      
      // Retourner au format Supabase pour la compatibilité API
      return {
        id: updatedData.id,
        user_id: '',
        name: updatedData.name,
        type: updatedData.type,
        capacity: updatedData.capacity,
        fuel_type: updatedData.fuelType,
        image_data: updatedData.imageData,
        updated_at: updatedData.updated_at,
      };
    } catch (error) {
      console.error('❌ Exception lors de la mise à jour:', error);
      return null;
    }
  },

  /**
   * 🗑️ Supprimer un véhicule
   */
  async deleteVehicle(id: string): Promise<boolean> {
    try {
      console.log(`🗑️ Suppression du véhicule: ${id}`);

      // ⚠️ WORKAROUND: RLS policies cassées, utiliser localStorage
      const stored = localStorage.getItem('vehicles');
      const vehicles = stored ? JSON.parse(stored) : [];
      const filtered = vehicles.filter((v: any) => v.id !== id);
      
      if (filtered.length === vehicles.length) {
        console.error('❌ Véhicule non trouvé:', id);
        return false;
      }

      localStorage.setItem('vehicles', JSON.stringify(filtered));
      console.log('✅ Véhicule supprimé:', id);
      
      return true;
    } catch (error) {
      console.error('❌ Exception lors de la suppression:', error);
      return false;
    }
  },

  /**
   * 📡 S'abonner aux changements de véhicules en temps réel
   */
  subscribeToVehicles(
    onChanged: (vehicle: Vehicle, action: 'created' | 'updated' | 'deleted') => void
  ): () => void {
    let subscription: any = null;
    let unsubscribed = false;

    const subscribeAsync = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          console.error('❌ Utilisateur non authentifié pour la subscription');
          return;
        }

        subscription = supabase
          .channel(`vehicles:${user.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'vehicles',
              filter: `user_id=eq.${user.id}`,
            },
            (payload: any) => {
              if (unsubscribed) return;

              const vehicle = payload.new as Vehicle;
              if (payload.eventType === 'INSERT') {
                console.log('📡 Nouveau véhicule reçu:', vehicle.name);
                onChanged(vehicle, 'created');
              } else if (payload.eventType === 'UPDATE') {
                console.log('📡 Véhicule mis à jour:', vehicle.name);
                onChanged(vehicle, 'updated');
              } else if (payload.eventType === 'DELETE') {
                const deletedVehicle = payload.old as Vehicle;
                console.log('📡 Véhicule supprimé:', deletedVehicle.name);
                onChanged(deletedVehicle, 'deleted');
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('✅ Subscription aux véhicules activée');
            } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
              console.warn('⚠️ Subscription aux véhicules fermée:', status);
            }
          });
      } catch (error) {
        console.error('❌ Erreur lors de la subscription:', error);
      }
    };

    subscribeAsync();

    // Retourner une fonction pour se désabonner
    return () => {
      unsubscribed = true;
      if (subscription) {
        supabase.removeChannel(subscription);
        subscription = null;
      }
    };
  },
};
