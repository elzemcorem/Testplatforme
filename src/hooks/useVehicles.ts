import { useState, useEffect, useCallback } from 'react';
import { supabase, vehiclesApi, Vehicle } from '../lib/supabase';

/**
 * Hook — Véhicules avec synchronisation Realtime
 * Aucune donnée ne passe par localStorage.
 */
export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await vehiclesApi.getAll();
    if (err) {
      setError(err.message);
    } else {
      setVehicles(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();

    // Realtime — écouter INSERT / UPDATE / DELETE sur la table vehicles
    const channel = supabase
      .channel('vehicles-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vehicles' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setVehicles((prev) => [...prev, payload.new as Vehicle]);
          } else if (payload.eventType === 'UPDATE') {
            setVehicles((prev) =>
              prev.map((v) => (v.id === (payload.new as Vehicle).id ? (payload.new as Vehicle) : v))
            );
          } else if (payload.eventType === 'DELETE') {
            setVehicles((prev) => prev.filter((v) => v.id !== (payload.old as Vehicle).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  return { vehicles, loading, error, refresh: load };
}
