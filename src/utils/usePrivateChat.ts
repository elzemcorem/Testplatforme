import { useEffect, useState, useCallback } from "react";
import { supabase } from "./supabase/client";
import { ChatMessage } from "../types";

interface UsePrivateChatParams {
  currentUserId: string;
  currentUserName: string;
  currentUserInitials: string;
  recipientId: string;
  enabled?: boolean;
}

interface UsePrivateChatReturn {
  messages: ChatMessage[];
  sendMessage: (content: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook React pour gérer les messages privés via Supabase Realtime Broadcast
 * 
 * Crée un channel privé entre deux users avec le format:
 * private:${[userId, recipientId].sort().join('-')}
 * 
 * Les messages ne sont pas persistés en base de données, seulement transmis via Realtime.
 * 
 * @param params - Configuration du chat privé
 * @returns { messages, sendMessage, isLoading, error }
 */
export function usePrivateChat({
  currentUserId,
  currentUserName,
  currentUserInitials,
  recipientId,
  enabled = true,
}: UsePrivateChatParams): UsePrivateChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Générer le channel name déterministe (toujours le même pour deux users)
  const getChannelName = useCallback(() => {
    const sorted = [currentUserId, recipientId].sort();
    return `private:${sorted.join("-")}`;
  }, [currentUserId, recipientId]);

  const sendMessage = useCallback(
    async (content: string): Promise<boolean> => {
      if (!content.trim()) return false;

      try {
        const channel = supabase.channel(getChannelName());
        
        const newMessage: ChatMessage = {
          id: `${Date.now()}-${Math.random()}`,
          senderId: currentUserId,
          senderName: currentUserName,
          senderInitials: currentUserInitials,
          content: content.trim(),
          timestamp: new Date(),
          type: "private",
          receiverId: recipientId,
        };

        // Envoyer le message via Realtime Broadcast
        const { status } = await channel.send("broadcast", {
          event: "new_message",
          payload: newMessage,
        });

        if (status === "ok") {
          // Ajouter le message à la liste locale
          setMessages((prev) => [...prev, newMessage]);
          return true;
        } else {
          console.error("❌ Erreur lors de l'envoi du message");
          return false;
        }
      } catch (err) {
        console.error("❌ Erreur sendMessage:", err);
        return false;
      }
    },
    [currentUserId, currentUserName, currentUserInitials, recipientId, getChannelName]
  );

  useEffect(() => {
    if (!enabled || !currentUserId || !recipientId) {
      setIsLoading(false);
      return;
    }

    let channel: any = null;
    let mounted = true;

    const initChat = async () => {
      try {
        const channelName = getChannelName();
        channel = supabase.channel(channelName, {
          config: {
            broadcast: { self: false }, // Ne pas recevoir ses propres messages
          },
        });

        channel
          .on("broadcast", { event: "new_message" }, ({ payload }: any) => {
            if (mounted) {
              console.log("📨 Message privé reçu:", payload);
              setMessages((prev) => {
                // Vérifier que le message n'existe pas déjà
                if (prev.some((m) => m.id === payload.id)) {
                  return prev;
                }
                return [...prev, payload];
              });
            }
          })
          .subscribe((status: string) => {
            if (status === "SUBSCRIBED") {
              console.log(`✅ Private chat channel subscribed: ${channelName}`);
              if (mounted) {
                setIsLoading(false);
                setError(null);
              }
            }
          });
      } catch (err) {
        if (mounted) {
          const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
          setError(errorMessage);
          console.error("❌ Erreur usePrivateChat:", err);
          setIsLoading(false);
        }
      }
    };

    initChat();

    // Cleanup
    return () => {
      mounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [currentUserId, recipientId, enabled, getChannelName]);

  return {
    messages,
    sendMessage,
    isLoading,
    error,
  };
}
