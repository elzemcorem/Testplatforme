import { createClient, RealtimeChannel } from "@supabase/supabase-js";

interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_initials: string;
  receiver_id: string | null;
  content: string;
  conversation_id: string;
  is_deleted: boolean;
  created_at: string;
}

interface ChatMessageUI {
  id: string;
  senderId: string;
  senderName: string;
  senderInitials: string;
  receiverId: string | null;
  text: string;
  timestamp: Date;
  conversationId: string;
}

class ChatService {
  private supabase;
  private subscriptions: Map<string, RealtimeChannel> = new Map();
  private conversationToEmailMap = new Map<string, string>(); // Mapper conversation_id -> receiver_email

  constructor() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("❌ Variables d'environnement Supabase manquantes");
    }

    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log("✅ ChatService initialisé");
  }

  /**
   * Initialiser le service (exécuter les migrations nécessaires)
   */
  async initialize(): Promise<void> {
    try {
      // Essayer de migrer le type de receiver_id en TEXT si ce n'est pas déjà fait
      const { error } = await (this.supabase as any).rpc("exec_sql", {
        sql: "ALTER TABLE chat_messages ALTER COLUMN receiver_id TYPE text;",
      });

      if (error) {
        console.warn("⚠️ Migration receiver_id non appliquée (probablement déjà en TEXT ou permission denied)");
        console.warn("📝 Si tu vois une erreur 'invalid input syntax for type uuid', exécute ceci dans Supabase:");
        console.warn("ALTER TABLE chat_messages ALTER COLUMN receiver_id TYPE text;");
      } else {
        console.log("✅ Colonne receiver_id migrée en TEXT");
      }
    } catch (error) {
      console.warn("⚠️ Impossible d'exécuter la migration automatiquement");
    }
  }

  /**
   * Charger tous les messages d'une conversation
   */
  async loadMessages(conversationId: string): Promise<ChatMessageUI[]> {
    try {
      console.log(`📥 Chargement des messages pour la conversation: ${conversationId}`);

      const { data, error } = await this.supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) {
        console.error("❌ Erreur lors du chargement des messages:", error);
        return [];
      }

      const mapped = (data || []).map(this.mapFromDB.bind(this));
      console.log(`✅ ${mapped.length} messages chargés`);
      return mapped;
    } catch (error) {
      console.error("❌ Exception lors du chargement des messages:", error);
      return [];
    }
  }

  /**
   * Envoyer un nouveau message
   */
  async sendMessage(
    senderId: string,
    senderName: string,
    senderInitials: string,
    content: string,
    conversationId: string,
    receiverId?: string
  ): Promise<ChatMessageUI | null> {
    try {
      console.log(`📤 Envoi d'un message à la conversation: ${conversationId}`);

      if (!content.trim()) {
        console.warn("⚠️ Le contenu du message est vide");
        return null;
      }

      // Toujours envoyer receiver_id, même si null (pour éviter erreur NOT NULL)
      // Pour messages généraux: receiver_id = null string
      // Pour messages privés: receiver_id = email du destinataire
      const actualReceiverId = receiverId || null;

      if (receiverId && receiverId.includes("@")) {
        console.log(`💾 Message privé - receiver: ${receiverId}`);
        this.conversationToEmailMap.set(conversationId, receiverId);
      } else {
        console.log(`💬 Message général`);
      }

      const { data, error } = await this.supabase
        .from("chat_messages")
        .insert([
          {
            sender_id: senderId,
            sender_name: senderName,
            sender_initials: senderInitials,
            receiver_id: actualReceiverId, // Toujours inclure, même si null
            content: content.trim(),
            conversation_id: conversationId,
            is_deleted: false,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        // Si erreur de type UUID, c'est qu'on n'a pas exécuté le SQL
        if (
          error.message?.includes("invalid input syntax for type uuid") ||
          error.message?.includes("type uuid")
        ) {
          console.error("❌ ERREUR: La colonne receiver_id doit être de type TEXT");
          console.error("📝 À EXÉCUTER dans Supabase SQL Editor:");
          console.error(
            "ALTER TABLE chat_messages ALTER COLUMN receiver_id TYPE text;"
          );
          console.error(
            "ALTER TABLE chat_messages ALTER COLUMN receiver_id DROP NOT NULL;"
          );
          return null;
        }

        console.error("❌ Erreur lors de l'insertion du message:", error);
        return null;
      }

      console.log("✅ Message envoyé avec succès");
      return this.mapFromDB(data);
    } catch (error) {
      console.error("❌ Exception lors de l'envoi du message:", error);
      return null;
    }
  }

  /**
   * Supprimer un message (soft delete)
   */
  async deleteMessage(messageId: string): Promise<boolean> {
    try {
      console.log(`🗑️ Suppression du message: ${messageId}`);

      const { error } = await this.supabase
        .from("chat_messages")
        .update({ is_deleted: true })
        .eq("id", messageId);

      if (error) {
        console.error("❌ Erreur lors de la suppression:", error);
        return false;
      }

      console.log("✅ Message supprimé");
      return true;
    } catch (error) {
      console.error("❌ Exception lors de la suppression:", error);
      return false;
    }
  }

  /**
   * S'abonner aux changements d'une conversation en Realtime
   */
  subscribeToConversation(
    conversationId: string,
    onMessageReceived: (message: ChatMessageUI) => void,
    onMessageDeleted?: (messageId: string) => void
  ): () => void {
    try {
      console.log(`🔄 Abonnement à la conversation: ${conversationId}`);

      const encodedConversationId = encodeURIComponent(conversationId);
      const channel = this.supabase
        .channel(`chat:${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "chat_messages",
            filter: `conversation_id=eq.${encodedConversationId}`,
          },
          (payload) => {
            console.log("📬 Nouveau message reçu via Realtime");
            const message = this.mapFromDB(payload.new as ChatMessage);
            onMessageReceived(message);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "chat_messages",
            filter: `conversation_id=eq.${encodedConversationId}`,
          },
          (payload) => {
            const dbMessage = payload.new as ChatMessage;
            if (dbMessage.is_deleted && onMessageDeleted) {
              console.log("🗑️ Message supprimé détecté via Realtime");
              onMessageDeleted(dbMessage.id);
            }
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            console.log("✅ Souscription au canal établie");
          } else if (status === "CHANNEL_ERROR") {
            console.error("❌ Erreur d'abonnement au canal");
          }
        });

      this.subscriptions.set(conversationId, channel);

      // Retourner une fonction de cleanup
      return () => {
        console.log(`❌ Désinscription de la conversation: ${conversationId}`);
        this.supabase.removeChannel(channel);
        this.subscriptions.delete(conversationId);
      };
    } catch (error) {
      console.error("❌ Exception lors de l'abonnement:", error);
      return () => {};
    }
  }

  /**
   * Convertir un message de la DB au format UI
   */
  private mapFromDB(dbMessage: ChatMessage): ChatMessageUI {
    return {
      id: dbMessage.id,
      senderId: dbMessage.sender_id,
      senderName: dbMessage.sender_name,
      senderInitials: dbMessage.sender_initials,
      receiverId: dbMessage.receiver_id,
      text: dbMessage.content,
      timestamp: new Date(dbMessage.created_at),
      conversationId: dbMessage.conversation_id,
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

export const chatService = new ChatService();
