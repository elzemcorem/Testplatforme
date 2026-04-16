import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Avatar } from "./ui/avatar";
import { ScrollArea } from "./ui/scroll-area";
import { Send, Users, User as UserIcon } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner@2.0.3";
import { cn } from "./ui/utils";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderInitials: string;
  receiverId: string | null; // null = message général
  text: string;
  timestamp: Date;
  conversationId: string;
}

interface UserAccount {
  id: string;
  email: string;
  name: string;
  initials: string;
  role: string;
}

export function Chat() {
  const { currentUser, getAllAccounts } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<UserAccount[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<string>("general");
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll vers le bas
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Charger les utilisateurs connectés depuis localStorage
  useEffect(() => {
    loadOnlineUsers();
    const interval = setInterval(loadOnlineUsers, 2000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const loadOnlineUsers = () => {
    const allAccounts = getAllAccounts();
    // Filtrer pour ne pas inclure l'utilisateur actuel
    const others = allAccounts.filter((user: UserAccount) => user.id !== currentUser?.id);
    setOnlineUsers(others);
  };

  // Charger les messages depuis localStorage
  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadMessages = () => {
    const stored = localStorage.getItem("chat_messages");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const messagesWithDates = parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(messagesWithDates);
      } catch (error) {
        console.error("Error loading messages:", error);
      }
    }
  };

  const saveMessages = (newMessages: Message[]) => {
    localStorage.setItem("chat_messages", JSON.stringify(newMessages));
    setMessages(newMessages);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedConversation]);

  // Générer l'ID de conversation entre deux utilisateurs
  const getConversationId = (userId1: string, userId2: string) => {
    return [userId1, userId2].sort().join("_");
  };

  // Filtrer les messages pour la conversation sélectionnée
  const filteredMessages = messages.filter(msg => {
    if (selectedConversation === "general") {
      return msg.receiverId === null;
    }
    // Pour les conversations privées, vérifier que le message appartient à cette conversation
    // et que l'utilisateur actuel est soit l'expéditeur soit le destinataire
    return (
      msg.conversationId === selectedConversation &&
      (msg.senderId === currentUser?.id || msg.receiverId === currentUser?.id)
    );
  });

  // Envoyer un message
  const handleSendMessage = () => {
    if (!messageInput.trim() || !currentUser) return;

    const conversationId = selectedConversation === "general" 
      ? "general" 
      : selectedConversation;
    
    const receiverId = selectedConversation === "general" 
      ? null 
      : selectedUser?.id || null;

    const newMessage: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderInitials: currentUser.initials,
      receiverId,
      text: messageInput,
      timestamp: new Date(),
      conversationId,
    };

    const updatedMessages = [...messages, newMessage];
    saveMessages(updatedMessages);
    setMessageInput("");
    toast.success("Message envoyé");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const selectConversation = (user: UserAccount) => {
    const convId = getConversationId(currentUser!.id, user.id);
    setSelectedConversation(convId);
    setSelectedUser(user);
  };

  const selectGeneralChat = () => {
    setSelectedConversation("general");
    setSelectedUser(null);
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrateur";
      case "controller":
        return "Contrôleur";
      case "user":
        return "Utilisateur";
      default:
        return role;
    }
  };

  return (
    <div className="p-6 h-[calc(100vh-6rem)]">
      <div className="flex gap-6 h-full">
        {/* Liste des conversations */}
        <Card className="w-80 flex flex-col border-2 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Conversations
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full px-4">
              <div className="space-y-2 pb-4">
                {/* Chat général */}
                <div
                  className={cn(
                    "p-3 rounded-lg cursor-pointer transition-all",
                    selectedConversation === "general"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                  onClick={selectGeneralChat}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-white font-semibold">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Chat Général</p>
                      <p className="text-sm opacity-70">
                        Tous les utilisateurs
                      </p>
                    </div>
                  </div>
                </div>

                {/* Utilisateurs en ligne */}
                <div className="pt-3 border-t">
                  <p className="text-sm text-muted-foreground mb-2 px-1">
                    Utilisateurs connectés ({onlineUsers.length})
                  </p>
                  {onlineUsers.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      Aucun autre utilisateur connecté
                    </div>
                  ) : (
                    onlineUsers.map((user) => {
                      const isSelected = selectedConversation === getConversationId(currentUser!.id, user.id);
                      return (
                        <div
                          key={user.id}
                          className={cn(
                            "p-3 rounded-lg cursor-pointer transition-all mb-2",
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          )}
                          onClick={() => selectConversation(user)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-semibold">
                                {user.initials}
                              </div>
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm opacity-70 capitalize">
                                {getRoleName(user.role)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Zone de messages */}
        <Card className="flex-1 flex flex-col border-2 border-primary/20">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="flex items-center gap-2">
              {selectedConversation === "general" ? (
                <>
                  <Users className="w-5 h-5 text-primary" />
                  Chat Général
                </>
              ) : (
                <>
                  <UserIcon className="w-5 h-5 text-primary" />
                  {selectedUser?.name}
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({getRoleName(selectedUser?.role || "user")})
                  </span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {filteredMessages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Aucun message pour le moment</p>
                    <p className="text-sm mt-2">
                      Soyez le premier à envoyer un message !
                    </p>
                  </div>
                ) : (
                  filteredMessages.map((message) => {
                    const isOwnMessage = message.senderId === currentUser?.id;
                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "flex gap-3",
                          isOwnMessage ? "flex-row-reverse" : "flex-row"
                        )}
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                          {message.senderInitials}
                        </div>
                        <div
                          className={cn(
                            "flex-1 max-w-[70%]",
                            isOwnMessage ? "items-end" : "items-start"
                          )}
                        >
                          <div
                            className={cn(
                              "rounded-lg px-4 py-2",
                              isOwnMessage
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            )}
                          >
                            {!isOwnMessage && (
                              <p className="text-xs font-semibold mb-1 opacity-70">
                                {message.senderName}
                              </p>
                            )}
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {message.text}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 px-2">
                            {message.timestamp.toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input de message */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder={
                    selectedConversation === "general"
                      ? "Envoyer un message à tous..."
                      : `Envoyer un message à ${selectedUser?.name}...`
                  }
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Appuyez sur Entrée pour envoyer
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
