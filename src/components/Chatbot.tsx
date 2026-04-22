import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Send, MessageCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import { createClient } from "@supabase/supabase-js";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface EdgeFunctionResponse {
  response?: string;
  error?: string;
  model?: string;
}

export function Chatbot() {
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMsg: ChatMessage = {
        id: "welcome",
        role: "assistant",
        content:
          "👋 Bonjour ! Je suis votre assistant intelligent TestPlatforme. Je peux vous aider avec les réservations, les véhicules disponibles, vos statistiques, votre profil et la navigation dans la plateforme. Posez-moi votre question.",
        timestamp: new Date(),
      };
      setMessages([welcomeMsg]);
    }
  }, [messages.length]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    if (isAuthLoading) {
      toast.info("Chargement de votre session en cours...");
      return;
    }

    if (!currentUser) {
      toast.error("Vous devez être connecté pour utiliser le chatbot.");
      return;
    }

    const userMsg: ChatMessage = {
      id: `${Date.now()}`,
      role: "user",
      content: trimmedInput,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      const history = updatedMessages
        .filter((message) => message.id !== "welcome")
        .slice(-10)
        .map((message) => ({
          role: message.role,
          content: message.content,
        }));

      const { data, error } = await supabase.functions.invoke<EdgeFunctionResponse>("chatbot-ai", {
        body: {
          message: trimmedInput,
          conversationHistory: history,
        },
        headers: accessToken
          ? {
              Authorization: `Bearer ${accessToken}`,
            }
          : undefined,
      });

      if (error) {
        throw error;
      }

      if (!data?.response) {
        throw new Error(data?.error || "Réponse invalide du chatbot.");
      }

      const assistantMsg: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error("Erreur chatbot:", error);
      toast.error("Impossible de contacter l'assistant intelligent.");

      const errorMsg: ChatMessage = {
        id: `${Date.now()}-error`,
        role: "assistant",
        content:
          "😞 Désolé, le chatbot est momentanément indisponible. Veuillez réessayer dans un instant.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-blue-50 to-white dark:from-slate-900 dark:to-slate-800 rounded-lg border border-blue-200 dark:border-slate-700">
      <div className="flex items-center gap-3 p-4 border-b border-blue-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <MessageCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">
            Assistant Intelligent
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            En ligne • OpenRouter + MCP + Supabase
          </p>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white rounded-bl-none"
                }`}
              >
                <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                <span className="text-xs opacity-70 mt-1 block">
                  {msg.timestamp.toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white px-4 py-2 rounded-lg rounded-bl-none">
                <div className="flex gap-2 items-center">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-blue-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex gap-2">
          <Input
            placeholder="Posez votre question sur la plateforme..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          💡 Exemple : « Quels véhicules sont disponibles ? », « Montre mes réservations », « Comment réserver ? »
        </p>
      </div>
    </div>
  );
}
