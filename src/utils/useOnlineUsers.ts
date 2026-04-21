import { useEffect, useState, useCallback } from "react";
import { supabase } from "./supabase/client";
import { OnlineUser } from "../types";

interface UseOnlineUsersReturn {
  onlineUsers: OnlineUser[];
  count: number;
  loading: boolean;
  error: string | null;
}

interface UserPresencePayload {
  userId: string;
  displayName: string;
  initials: string;
  avatarUrl?: string;
  onlineAt: string;
}

/**
 * Hook React pour tracker les utilisateurs en ligne via Supabase Presence API
 * 
 * Utilise le channel Realtime "online-users" et écoute les événements:
 * - 'sync': sync initial des presences existantes
 * - 'join': nouvel utilisateur connecté
 * - 'leave': utilisateur déconnecté
 * 
 * @param currentUserId - L'ID de l'utilisateur courant
 * @param currentUserDisplayName - Le nom à afficher pour l'utilisateur courant
 * @param currentUserInitials - Les initiales de l'utilisateur courant
 * @param excludeCurrentUser - Si true (défaut), exclure l'utilisateur courant de la liste
 * @returns { onlineUsers, count, loading, error }
 */
export function useOnlineUsers(
  currentUserId: string,
  currentUserDisplayName?: string,
  currentUserInitials?: string,
  excludeCurrentUser = true
): UseOnlineUsersReturn {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const updateOnlineUsers = useCallback((presences: Record<string, UserPresencePayload[]>) => {
    // Flattir et dédupliquer les utilisateurs
    const allUsers: Map<string, OnlineUser> = new Map();

    Object.values(presences).forEach((userList) => {
      userList.forEach((user) => {
        if (!excludeCurrentUser || user.userId !== currentUserId) {
          allUsers.set(user.userId, {
            userId: user.userId,
            displayName: user.displayName,
            initials: user.initials,
            avatarUrl: user.avatarUrl,
            onlineAt: user.onlineAt,
          });
        }
      });
    });

    setOnlineUsers(Array.from(allUsers.values()));
  }, [currentUserId, excludeCurrentUser]);

  useEffect(() => {
    if (!currentUserId) {
      setError("currentUserId is required");
      setLoading(false);
      return;
    }

    let channel: any = null;
    let mounted = true;

    const initPresence = async () => {
      try {
        // S'abonner au channel Presence
        channel = supabase.channel("online-users", {
          config: {
            presence: {
              key: currentUserId, // Clé de présence = userId
            },
          },
        });

        // Écouter les changements de présence
        channel
          .on("presence", { event: "sync" }, ({ newPresences }: any) => {
            if (mounted) {
              console.log("🔄 Sync presences:", Object.keys(newPresences).length, "users");
              updateOnlineUsers(newPresences);
              setLoading(false);
              setError(null);
            }
          })
          .on("presence", { event: "join" }, ({ key, newPresences }: any) => {
            if (mounted) {
              console.log("👤 User joined:", key);
              updateOnlineUsers(newPresences);
            }
          })
          .on("presence", { event: "leave" }, ({ key, leftPresences }: any) => {
            if (mounted) {
              console.log("👋 User left:", key);
              // Pour leave, les presences retournées sont vides/null, donc on met à jour simplement
              setOnlineUsers((prev) => prev.filter((u) => u.userId !== key));
            }
          })
          .subscribe(async (status: string) => {
            if (status === "SUBSCRIBED") {
              console.log("✅ Presence channel subscribed");

              // Tracker la présence de l'utilisateur courant
              const presencePayload: UserPresencePayload = {
                userId: currentUserId,
                displayName: currentUserDisplayName || "User",
                initials: currentUserInitials || "U",
                onlineAt: new Date().toISOString(),
              };

              console.log("📤 Broadcasting presence:", presencePayload);

              await channel.track(presencePayload);

              if (mounted) {
                setError(null);
              }
            }
          });

        if (mounted) {
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
          setError(errorMessage);
          console.error("❌ Erreur presence:", err);
          setLoading(false);
        }
      }
    };

    initPresence();

    // Cleanup
    return () => {
      mounted = false;
      if (channel) {
        console.log("🔌 Removing presence channel");
        supabase.removeChannel(channel);
      }
    };
  }, [currentUserId, currentUserDisplayName, currentUserInitials, updateOnlineUsers]);

  return {
    onlineUsers,
    count: onlineUsers.length,
    loading,
    error,
  };
}
