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
   * 📥 Charger tous les véhicules (Supabase → localStorage fallback)
   */
  async loadVehicles(): Promise<Vehicle[]> {
    try {
      console.log('🚗 Chargement des véhicules depuis Supabase...');
      
      // Essayer de charger depuis Supabase
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('⚠️ Erreur Supabase, basculer sur localStorage:', error.message);
        const localVehicles = this.loadVehiclesFromLocalStorage();
        if (localVehicles.length > 0) {
          console.log(`✅ ${localVehicles.length} véhicules chargés depuis localStorage`);
          return localVehicles;
        }
        return [];
      }

      if (data && data.length > 0) {
        console.log(`✅ ${data.length} véhicules chargés depuis Supabase`);
        // Sauvegarder en cache localStorage
        const cacheData = data.map((v: any) => ({
          id: v.id,
          name: v.name,
          type: v.type,
          capacity: v.capacity,
          fuelType: v.fuel_type,
          imageData: v.image_data,
          created_at: v.created_at,
        }));
        localStorage.setItem('vehicles', JSON.stringify(cacheData));
        return data;
      }

      console.log('ℹ️ Aucun véhicule trouvé');
      return [];
    } catch (error) {
      console.error('❌ Exception lors du chargement:', error);
      // Fallback sur localStorage en cas d'erreur critique
      return this.loadVehiclesFromLocalStorage();
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
   * ➕ Créer un nouveau véhicule (admin only)
   */
  async createVehicle(vehicle: Omit<Vehicle, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Vehicle | null> {
    try {
      console.log(`📝 Création du véhicule: ${vehicle.name}`);

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('❌ Utilisateur non authentifié');
        return null;
      }

      // Insérer dans Supabase
      const { data, error } = await supabase
        .from('vehicles')
        .insert([
          {
            name: vehicle.name,
            type: vehicle.type,
            capacity: vehicle.capacity,
            fuel_type: vehicle.fuel_type,
            image_data: vehicle.image_data,
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur Supabase:', error.message);
        // Fallback sur localStorage
        const newVehicleData = {
          id: Date.now().toString(),
          name: vehicle.name,
          type: vehicle.type,
          capacity: vehicle.capacity,
          fuelType: vehicle.fuel_type,
          imageData: vehicle.image_data,
          created_at: new Date().toISOString(),
        };
        const stored = localStorage.getItem('vehicles');
        const vehicles = stored ? JSON.parse(stored) : [];
        vehicles.push(newVehicleData);
        localStorage.setItem('vehicles', JSON.stringify(vehicles));
        return {
          id: newVehicleData.id,
          user_id: user.id,
          name: newVehicleData.name,
          type: newVehicleData.type,
          capacity: newVehicleData.capacity,
          fuel_type: newVehicleData.fuelType,
          image_data: newVehicleData.imageData,
        };
      }

      console.log('✅ Véhicule créé:', data.name);
      return data;
    } catch (error: any) {
      console.error('❌ Exception lors de la création:', error.message);
      throw error;
    }
  },

  /**
   * ✏️ Mettre à jour un véhicule (admin only)
   */
  async updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle | null> {
    try {
      console.log(`✏️ Mise à jour du véhicule: ${id}`);

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('❌ Utilisateur non authentifié');
        return null;
      }

      // Mettre à jour dans Supabase
      const { data, error } = await supabase
        .from('vehicles')
        .update({
          name: updates.name,
          type: updates.type,
          capacity: updates.capacity,
          fuel_type: updates.fuel_type,
          image_data: updates.image_data,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.warn('⚠️ Erreur Supabase, basculer sur localStorage:', error.message);
        // Fallback sur localStorage
        const stored = localStorage.getItem('vehicles');
        const vehicles = stored ? JSON.parse(stored) : [];
        const index = vehicles.findIndex((v: any) => v.id === id);
        
        if (index !== -1) {
          const updatedData = {
            ...vehicles[index],
            name: updates.name !== undefined ? updates.name : vehicles[index].name,
            type: updates.type !== undefined ? updates.type : vehicles[index].type,
            capacity: updates.capacity !== undefined ? updates.capacity : vehicles[index].capacity,
            fuelType: updates.fuel_type !== undefined ? updates.fuel_type : vehicles[index].fuelType,
            imageData: updates.image_data !== undefined ? updates.image_data : vehicles[index].imageData,
          };
          vehicles[index] = updatedData;
          localStorage.setItem('vehicles', JSON.stringify(vehicles));
          return {
            id: updatedData.id,
            user_id: user.id,
            name: updatedData.name,
            type: updatedData.type,
            capacity: updatedData.capacity,
            fuel_type: updatedData.fuelType,
            image_data: updatedData.imageData,
          };
        }
        return null;
      }

      console.log('✅ Véhicule mis à jour:', data.name);
      return data;
    } catch (error) {
      console.error('❌ Exception lors de la mise à jour:', error);
      return null;
    }
  },

  /**
   * 🗑️ Supprimer un véhicule (admin only)
   */
  async deleteVehicle(id: string): Promise<boolean> {
    try {
      console.log(`🗑️ Suppression du véhicule: ${id}`);

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('❌ Utilisateur non authentifié');
        return false;
      }

      // Supprimer de Supabase
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);

      if (error) {
        console.warn('⚠️ Erreur Supabase, basculer sur localStorage:', error.message);
        // Fallback sur localStorage
        const stored = localStorage.getItem('vehicles');
        const vehicles = stored ? JSON.parse(stored) : [];
        const filtered = vehicles.filter((v: any) => v.id !== id);
        
        if (filtered.length < vehicles.length) {
          localStorage.setItem('vehicles', JSON.stringify(filtered));
          return true;
        }
        return false;
      }

      console.log('✅ Véhicule supprimé:', id);
      return true;
    } catch (error) {
      console.error('❌ Exception lors de la suppression:', error);
      return false;
    }
  },

  /**
   * 📡 S'abonner aux changements de véhicules en temps réel (TOUS les véhicules)
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

        // ✅ SANS filtre user_id = reçoit TOUS les changements de véhicules
        subscription = supabase
          .channel(`vehicles:all`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'vehicles',
              // PAS de filtre user_id - tous les utilisateurs voient tous les changements
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
              console.log('✅ Subscription Realtime aux véhicules activée');
            } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
              console.warn('⚠️ Subscription fermée:', status);
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
