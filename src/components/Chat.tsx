import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { ScrollArea } from "./ui/scroll-area";
import { Send, Users, Trash2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner@2.0.3";
import { cn } from "./ui/utils";
import { supabase, chatApi, profilesApi, Profile, ChatMessage } from "../lib/supabase";

interface ChatMessageWithSender extends ChatMessage {
  sender: Pick<Profile, "id" | "name" | "avatar_url" | "role"> | null;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getRoleName(role: string) {
  switch (role) {
    case "admin":       return "Administrateur";
    case "controller":  return "Contrôleur";
    default:            return "Utilisateur";
  }
}

export function Chat() {
  const { currentUser } = useAuth();
  const [messages, setMessages]       = useState<ChatMessageWithSender[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Profile[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending]       = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  // ── Chargement initial des messages ──────────────────────────────
  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    const { data, error } = await chatApi.getMessages(80);
    if (error) {
      toast.error("Impossible de charger les messages.");
      return;
    }
    const ordered = ((data as ChatMessageWithSender[]) ?? []).reverse();
    setMessages(ordered);
    setTimeout(scrollToBottom, 50);
  };

  // ── Supabase Realtime — nouveaux messages ────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel("chat-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        async (payload) => {
          const newMsg = payload.new as ChatMessage;
          if (newMsg.is_deleted) return;
          const { data: sender } = await profilesApi.getById(newMsg.sender_id);
          setMessages((prev) => [
            ...prev,
            { ...newMsg, sender: sender ?? null },
          ]);
          setTimeout(scrollToBottom, 50);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chat_messages" },
        (payload) => {
          const updated = payload.new as ChatMessage;
          setMessages((prev) =>
            updated.is_deleted
              ? prev.filter((m) => m.id !== updated.id)
              : prev.map((m) =>
                  m.id === updated.id ? { ...m, ...updated } : m
                )
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // ── Supabase Realtime Presence — utilisateurs en ligne ──────────
  useEffect(() => {
    if (!currentUser) return;

    const presenceChannel = supabase.channel("chat-presence", {
      config: { presence: { key: currentUser.id } },
    });

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState<{ user_id: string; profile: Profile }>();
        const profiles = Object.values(state)
          .flat()
          .map((p) => p.profile)
          .filter((p): p is Profile => !!p && p.id !== currentUser.id);
        const unique = profiles.filter(
          (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i
        );
        setOnlineUsers(unique);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          const { data: profile } = await profilesApi.getById(currentUser.id);
          await presenceChannel.track({
            user_id: currentUser.id,
            profile: profile ?? { id: currentUser.id, name: currentUser.name },
          });
        }
      });

    return () => {
      presenceChannel.untrack();
      supabase.removeChannel(presenceChannel);
    };
  }, [currentUser]);

  // ── Envoyer un message ────────────────────────────────────────────
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !currentUser || isSending) return;
    setIsSending(true);
    const { error } = await chatApi.send(currentUser.id, messageInput.trim());
    if (error) {
      toast.error("Erreur", { description: "Impossible d'envoyer le message." });
    } else {
      setMessageInput("");
    }
    setIsSending(false);
  };

  const handleDeleteMessage = async (msgId: string) => {
    const { error } = await chatApi.delete(msgId);
    if (error) toast.error("Impossible de supprimer ce message.");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="p-6 h-[calc(100vh-6rem)]">
      <div className="flex gap-6 h-full">

        {/* Sidebar utilisateurs en ligne */}
        <Card className="w-72 flex flex-col border-2 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Chat Général
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full px-4">
              <div className="space-y-2 pb-4">
                <p className="text-sm text-muted-foreground px-1 pt-2">
                  Utilisateurs en ligne ({onlineUsers.length})
                </p>
                {onlineUsers.length === 0 ? (
                  <p className="text-center py-4 text-muted-foreground text-sm">
                    Aucun autre utilisateur connecté
                  </p>
                ) : (
                  onlineUsers.map((user) => (
                    <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                      <div className="relative">
                        <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {getInitials(user.name)}
                        </div>
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{getRoleName(user.role)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Zone de messages */}
        <Card className="flex-1 flex flex-col border-2 border-primary/20">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Chat Général
              <span className="text-sm font-normal text-muted-foreground ml-2">
                — {onlineUsers.length + 1} connecté(s)
              </span>
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Aucun message pour le moment</p>
                    <p className="text-sm mt-2">Soyez le premier à envoyer un message !</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOwn = message.sender_id === currentUser?.id;
                    const senderName = message.sender?.name ?? "Utilisateur";
                    const initials   = getInitials(senderName);
                    return (
                      <div key={message.id} className={cn("flex gap-3 group", isOwn ? "flex-row-reverse" : "flex-row")}>
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white text-xs">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className={cn("flex-1 max-w-[70%] flex flex-col", isOwn ? "items-end" : "items-start")}>
                          <div className={cn("rounded-lg px-4 py-2 relative", isOwn ? "bg-primary text-primary-foreground" : "bg-muted")}>
                            {!isOwn && (
                              <p className="text-xs font-semibold mb-1 opacity-70">{senderName}</p>
                            )}
                            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                            {isOwn && (
                              <button
                                onClick={() => handleDeleteMessage(message.id)}
                                className="absolute -top-2 -left-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                title="Supprimer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 px-2">
                            {new Date(message.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Envoyer un message à tous…"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                  disabled={isSending}
                />
                <Button onClick={handleSendMessage} disabled={!messageInput.trim() || isSending} className="bg-primary hover:bg-primary/90">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Entrée pour envoyer · Maj+Entrée pour retour à la ligne</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
