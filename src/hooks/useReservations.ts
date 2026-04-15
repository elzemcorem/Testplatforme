import { useState, useEffect, useCallback } from 'react';
import { reservationsApi, realtimeApi, ReservationFull, ReservationStatus } from '../lib/supabase';

interface UseReservationsOptions {
  userId?: string;        // si fourni → getMine(), sinon → getAll()
  status?: ReservationStatus;
}

/**
 * Hook — Réservations avec synchronisation Realtime
 * Aucune donnée ne passe par localStorage.
 */
export function useReservations(options: UseReservationsOptions = {}) {
  const { userId, status } = options;
  const [reservations, setReservations] = useState<ReservationFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    let result;
    if (status) {
      result = await reservationsApi.getByStatus(status);
    } else if (userId) {
      result = await reservationsApi.getMine(userId);
    } else {
      result = await reservationsApi.getAll();
    }

    if (result.error) {
      setError(result.error.message);
    } else {
      setReservations(result.data ?? []);
    }
    setLoading(false);
  }, [userId, status]);

  useEffect(() => {
    load();

    // Realtime — nouvelles réservations (INSERT)
    const subNew = realtimeApi.onNewReservation(() => {
      load(); // re-fetch pour avoir la vue complète avec JOIN
    });

    // Realtime — mises à jour de statut (UPDATE)
    const subUpdate = realtimeApi.onReservationUpdate(() => {
      load();
    });

    return () => {
      subNew.unsubscribe();
      subUpdate.unsubscribe();
    };
  }, [load]);

  return { reservations, loading, error, refresh: load };
}
