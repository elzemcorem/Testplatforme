import { useState, useEffect, useCallback } from 'react';
import { notificationsApi, realtimeApi, Notification } from '../lib/supabase';
import { toast } from 'sonner';

/**
 * Hook — Notifications temps réel pour un utilisateur
 * Aucune donnée ne passe par localStorage.
 */
export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await notificationsApi.getUnread(userId);
    if (!error) {
      setNotifications(data ?? []);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    load();

    // Realtime — nouvelle notification pour cet utilisateur
    const sub = realtimeApi.onNotification(userId, (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
      // Afficher un toast au moment de la réception
      toast(newNotif.title, { description: newNotif.message });
    });

    return () => {
      sub.unsubscribe();
    };
  }, [userId, load]);

  const markRead = useCallback(async (id: string) => {
    await notificationsApi.markRead(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    await notificationsApi.markAllRead(userId);
    setNotifications([]);
  }, [userId]);

  return {
    notifications,
    unreadCount: notifications.length,
    loading,
    markRead,
    markAllRead,
    refresh: load,
  };
}
