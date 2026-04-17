import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Send, MessageCircle, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import { createClient } from "@supabase/supabase-js";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  action?: string;
}

type Intent =
  | "greeting"
  | "help"
  | "reservation"
  | "cancel_reservation"
  | "report"
  | "satisfaction"
  | "vehicle_info"
  | "profile"
  | "unknown";

/**
 * Composant Chatbot Intelligent
 * Assistant conversationnel pour la plateforme de réservation de véhicules
 */
export function Chatbot() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialiser le client Supabase
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  // Message de bienvenue
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMsg: ChatMessage = {
        id: "welcome",
        role: "assistant",
        content: `👋 Bonjour! Je suis votre assistant intelligent. Je peux vous aider avec:
        
• 📅 **Réservations** - "Je veux réserver une Toyota pour demain"
• ❌ **Annulations** - "Annule ma réservation de vendredi"
• 📊 **Rapports** - "Montre-moi le rapport de satisfaction du mois"
• 🚗 **Informations** - "Quels véhicules sont disponibles?"
• 👤 **Profil** - "Affiche mon profil"
• 📚 **Aide** - "Comment fonctionne la plateforme?"

Comment puis-je vous aider?`,
        timestamp: new Date(),
      };
      setMessages([welcomeMsg]);
    }
  }, []);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /**
   * Déterminer l'intention de l'utilisateur (NLU basique)
   */
  const recognizeIntent = (text: string): Intent => {
    const lower = text.toLowerCase().trim();

    if (
      lower.match(
        /(bonjour|salut|hi|hello|ça va|comment tu vas|quoi de neuf)/
      )
    ) {
      return "greeting";
    }

    if (
      lower.match(
        /(réserv|book|je veux réserver|réserver une|réserver un véhicule)/
      )
    ) {
      return "reservation";
    }

    if (
      lower.match(
        /(annul|cancel|supprimer|décommander|je veux annuler|annule ma)/
      )
    ) {
      return "cancel_reservation";
    }

    if (lower.match(/(rapport|report|statistiques|analytics|données)/)) {
      return "report";
    }

    if (
      lower.match(
        /(satisfaction|satisfait|insatisfait|évaluation|feedback|avis)/
      )
    ) {
      return "satisfaction";
    }

    if (
      lower.match(
        /(véhicule|voiture|voitures|disponible|dispo|quelle voiture|auto)/
      )
    ) {
      return "vehicle_info";
    }

    if (
      lower.match(/(profil|compte|mes info|mon compte|mon profil|utilisateur)/)
    ) {
      return "profile";
    }

    if (
      lower.match(
        /(aide|help|comment|fonctionnement|comment fonctionne|guide|doc)/
      )
    ) {
      return "help";
    }

    return "unknown";
  };

  /**
   * Générer une réponse basée sur l'intention
   */
  const generateResponse = async (
    userMessage: string,
    intent: Intent
  ): Promise<{ response: string; action?: string }> => {
    const userName = user?.user_metadata?.name || "Utilisateur";

    switch (intent) {
      case "greeting":
        return {
          response: `👋 Bonjour ${userName}! J'espère que vous allez bien. Comment puis-je vous aider aujourd'hui?`,
        };

      case "reservation": {
        const vehicles = await fetchAvailableVehicles();
        if (vehicles.length === 0) {
          return {
            response:
              "😕 Désolé, aucun véhicule n'est actuellement disponible. Voulez-vous que je vous propose une date alternative?",
          };
        }
        return {
          response: `✅ Je vais vous aider à réserver un véhicule! 
          
Véhicules disponibles:
${vehicles.map((v, i) => `${i + 1}. ${v.name} (${v.type})`).join("\n")}

Pouvez-vous préciser:
- Quelle date vous souhaitez? (YYYY-MM-DD)
- À quelle heure?
- Pour combien de jours?`,
          action: "await_reservation_details",
        };
      }

      case "cancel_reservation": {
        const reservations = await fetchUserReservations();
        if (reservations.length === 0) {
          return {
            response:
              "📭 Vous n'avez aucune réservation active à annuler.",
          };
        }
        return {
          response: `Vos réservations:
${reservations.map((r, i) => `${i + 1}. ${r.vehicleName} - ${new Date(r.date).toLocaleDateString("fr-FR")}`).join("\n")}

Quelle réservation souhaitez-vous annuler? (Tapez le numéro)`,
          action: "await_cancellation_choice",
        };
      }

      case "report": {
        return {
          response: `📊 Je peux générer des rapports sur:
          
• 📈 Rapport mensuel de satisfaction
• 📋 Historique de vos réservations
• 💰 Coûts et facturations
• 📊 Statistiques d'utilisation

Quel type de rapport désirez-vous? (Tapez le numéro ou décrivez)`,
          action: "await_report_choice",
        };
      }

      case "satisfaction": {
        return {
          response: `📝 Le tableau de satisfaction permet d'évaluer la qualité des services:

**Services évalués:**
• 🏢 **DCM** - Direction & Management
• 🚗 **DTM** - Département Technique & Mécanique
• 📋 **DAF** - Département Administratif & Financier
• ⚠️ **QHSE** - Qualité, Hygiène, Sécurité
• 📊 **DO** - Direction Opérationnelle

Vous pouvez accéder au tableau de satisfaction via le **Rapport de Sortie** dans le menu.

Voulez-vous que je vous montre comment utiliser le tableau?`,
        };
      }

      case "vehicle_info": {
        const vehicles = await fetchAllVehicles();
        if (vehicles.length === 0) {
          return {
            response: "Aucun véhicule n'est enregistré dans le système.",
          };
        }
        return {
          response: `🚗 Voici les véhicules disponibles:
          
${vehicles
  .slice(0, 5)
  .map(
    (v, i) =>
      `${i + 1}. **${v.name}** (${v.type}) - ${v.status === "available" ? "✅ Disponible" : "❌ Indisponible"}`
  )
  .join("\n")}

${vehicles.length > 5 ? `\n...et ${vehicles.length - 5} autres véhicules` : ""}

Besoin de réserver? Tapez "réserver" et précisez le modèle!`,
        };
      }

      case "profile": {
        const profile = await fetchUserProfile();
        if (!profile) {
          return {
            response: "Impossible de charger votre profil. Veuillez réessayer.",
          };
        }
        return {
          response: `👤 **Votre Profil:**

• **Nom:** ${profile.name || "N/A"}
• **Email:** ${profile.email || "N/A"}
• **Rôle:** ${profile.role === "admin" ? "🔴 Administrateur" : profile.role === "controller" ? "🟠 Contrôleur" : "🟢 Utilisateur"}
• **Membre depuis:** ${new Date(profile.created_at).toLocaleDateString("fr-FR")}

Vous pouvez modifier vos informations dans **Paramètres**.`,
        };
      }

      case "help": {
        return {
          response: `📚 **Guide de la Plateforme:**

**🚗 Réservations:**
- Cliquez sur "Réserver"
- Sélectionnez un véhicule et une date
- Confirmez votre réservation

**📊 Rapports:**
- Allez dans "Rapport de Sortie"
- Remplissez le tableau de satisfaction
- Exportez en PDF, Excel ou Word

**💬 Chat en Temps Réel:**
- Utilisez le chat pour communiquer avec d'autres utilisateurs
- Messages privés ou publics disponibles

**👤 Profil:**
- Consultez vos informations dans "Paramètres"

**❓ Plus d'aide:**
- Tapez vos questions, je suis là pour vous aider!`,
        };
      }

      case "unknown":
      default:
        return {
          response: `Je n'ai pas bien compris votre demande. 🤔 

Pouvez-vous reformuler? Ou tapez l'un des mots-clés:
• **réserver** - faire une réservation
• **annuler** - annuler une réservation
• **rapport** - générer un rapport
• **véhicules** - voir les véhicules
• **aide** - afficher le guide
• **profil** - voir mon profil`,
        };
    }
  };

  /**
   * Charger les véhicules disponibles
   */
  const fetchAvailableVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, name, type, status")
        .eq("status", "available")
        .limit(5);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Erreur lors du chargement des véhicules:", error);
      return [];
    }
  };

  /**
   * Charger tous les véhicules
   */
  const fetchAllVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, name, type, status")
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Erreur:", error);
      return [];
    }
  };

  /**
   * Charger les réservations de l'utilisateur
   */
  const fetchUserReservations = async () => {
    try {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("reservations")
        .select("id, vehicle:vehicles(name), date, status")
        .eq("user_id", user.id)
        .eq("status", "confirmed")
        .limit(5);

      if (error) throw error;
      return (
        data?.map((r: any) => ({
          id: r.id,
          vehicleName: r.vehicle?.name || "Véhicule",
          date: r.date,
        })) || []
      );
    } catch (error) {
      console.error("Erreur:", error);
      return [];
    }
  };

  /**
   * Charger le profil utilisateur
   */
  const fetchUserProfile = async () => {
    try {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    } catch (error) {
      console.error("Erreur:", error);
      return null;
    }
  };

  /**
   * Traiter l'entrée utilisateur
   */
  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      // Reconnaître l'intention
      const intent = recognizeIntent(input);

      // Générer la réponse
      const { response, action } = await generateResponse(input, intent);

      // Ajouter le message de l'assistant
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
        action,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error("Erreur:", error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "😞 Désolé, une erreur s'est produite. Veuillez réessayer.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-blue-50 to-white dark:from-slate-900 dark:to-slate-800 rounded-lg border border-blue-200 dark:border-slate-700">
      {/* En-tête */}
      <div className="flex items-center gap-3 p-4 border-b border-blue-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <MessageCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">
            Assistant Intelligent
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            En ligne • Prêt à vous aider
          </p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
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

      {/* Input */}
      <div className="p-4 border-t border-blue-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex gap-2">
          <Input
            placeholder="Tapez votre question..."
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
          💡 Conseil: Décrivez ce que vous voulez faire (réserver, annuler,
          rapport...)
        </p>
      </div>
    </div>
  );
}
