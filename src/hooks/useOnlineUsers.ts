import { useState, useEffect, useCallback } from 'react';
import { supabase, profilesApi, Profile } from '../lib/supabase';

/**
 * Hook — Présence en ligne des utilisateurs (Realtime)
 * Aucune donnée ne passe par localStorage.
 */
export function useOnlineUsers() {
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await profilesApi.getAll();
    if (!error) {
      setAllUsers(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();

    // Realtime — mise à jour du champ is_online dans profiles
    const channel = supabase
      .channel('profiles-presence')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          const updated = payload.new as Profile;
          setAllUsers((prev) =>
            prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const onlineUsers = allUsers.filter((u) => u.is_online);

  return { allUsers, onlineUsers, loading };
}
