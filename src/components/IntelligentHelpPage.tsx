import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { MessageSquare } from "lucide-react";

/**
 * Page d'Aide Intelligente - Chatbot
 * 
 * Cette page est prête pour l'intégration du chatbot.
 * Le composant du chatbot sera inséré ici.
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
            Assistance et support disponibles 24/7
          </p>
        </div>
      </div>

      {/* Chatbot Container */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Assistant Intelligent
          </CardTitle>
        </CardHeader>
        <CardContent className="min-h-96">
          {/* LE CHATBOT SERA INSÉRÉ ICI */}
          <div id="chatbot-container" className="w-full h-full">
            {/* Placeholder - sera remplacé par le composant chatbot */}
            <div className="flex items-center justify-center h-96 text-center text-gray-400">
              <p>🤖 Chatbot en cours de chargement...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
