import { createClient } from "@supabase/supabase-js";

interface OnlineUser {
  id: string;
  email: string;
  name: string;
  initials: string;
  role: string;
  lastSeen: Date;
}

class PresenceService {
  private supabase;
  private userId: string | null = null;
  private presenceSubscription: any = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("❌ Variables d'environnement Supabase manquantes");
    }

    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
  }

  /**
   * Enregistrer l'utilisateur comme "en ligne"
   */
  async markOnline(user: {
    id: string;
    email: string;
    name: string;
    initials: string;
    role: string;
  }): Promise<void> {
    try {
      this.userId = user.email;

      const { error } = await this.supabase
        .from("user_presence")
        .upsert(
          {
            user_id: user.email,
            email: user.email,
            name: user.name,
            initials: user.initials,
            role: user.role,
            is_online: true,
            last_seen: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

      if (error) {
        console.error("❌ Erreur présence:", error);
      } else {
        console.log("✅ Utilisateur en ligne");
        this.startHeartbeat(user.email);
      }
    } catch (error) {
      console.error("❌ Erreur markOnline:", error);
    }
  }

  /**
   * Marquer l'utilisateur comme "hors ligne"
   */
  async markOffline(): Promise<void> {
    try {
      if (!this.userId) return;
      this.stopHeartbeat();

      const { error } = await this.supabase
        .from("user_presence")
        .update({
          is_online: false,
          last_seen: new Date().toISOString(),
        })
        .eq("user_id", this.userId);

      if (error) {
        console.error("❌ Erreur markOffline:", error);
      } else {
        console.log("✅ Utilisateur hors ligne");
      }
    } catch (error) {
      console.error("❌ Erreur:", error);
    }
  }

  /**
   * Charger les utilisateurs en ligne
   */
  async getOnlineUsers(): Promise<OnlineUser[]> {
    try {
      const { data, error } = await this.supabase
        .from("user_presence")
        .select("*")
        .eq("is_online", true)
        .order("last_seen", { ascending: false });

      if (error) {
        console.error("❌ Erreur getOnlineUsers:", error);
        return [];
      }

      return (data || []).map((user: any) => ({
        id: user.user_id,
        email: user.email,
        name: user.name,
        initials: user.initials,
        role: user.role,
        lastSeen: new Date(user.last_seen),
      }));
    } catch (error) {
      console.error("❌ Erreur:", error);
      return [];
    }
  }

  /**
   * S'abonner aux changements de présence
   */
  subscribeToPresence(
    onUsersChange: (users: OnlineUser[]) => void
  ): () => void {
    try {
      this.presenceSubscription = this.supabase
        .channel("presence_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "user_presence",
          },
          async () => {
            console.log("🔄 Changement de présence");
            const users = await this.getOnlineUsers();
            onUsersChange(users);
          }
        )
        .subscribe();

      console.log("✅ Présence subscribe");

      return () => {
        if (this.presenceSubscription) {
          this.supabase.removeChannel(this.presenceSubscription);
        }
      };
    } catch (error) {
      console.error("❌ Erreur subscribe:", error);
      return () => {};
    }
  }

  private startHeartbeat(userEmail: string): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(async () => {
      try {
        await this.supabase
          .from("user_presence")
          .update({ last_seen: new Date().toISOString() })
          .eq("user_id", userEmail);
      } catch (error) {
        console.warn("⚠️ Heartbeat failed");
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

export const presenceService = new PresenceService();
