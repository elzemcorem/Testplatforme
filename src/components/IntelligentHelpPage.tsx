import { MessageSquare } from "lucide-react";
import { Chatbot } from "./Chatbot";

/**
 * Page d'Aide Intelligente - Chatbot Intelligent
 * 
 * Assistant conversationnel pour la plateforme de réservation de véhicules
 */
export function IntelligentHelpPage() {
  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-3">
        <MessageSquare className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Aide Intelligente
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Assistant conversationnel disponible 24/7
          </p>
        </div>
      </div>

      {/* Chatbot Container - Hauteur responsive */}
      <div className="h-screen max-h-[600px] rounded-lg overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700">
        <Chatbot />
      </div>
    </div>
  );
}
