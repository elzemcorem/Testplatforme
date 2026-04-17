import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { HelpCircle, Search, BookOpen, MessageSquare } from "lucide-react";
import { Input } from "./ui/input";
import { useState } from "react";

export function IntelligentHelpPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const helpCategories = [
    {
      id: "vehicles",
      title: "Gestion des Véhicules",
      icon: "🚗",
      description: "Informations sur la gestion et configuration des véhicules",
      content: "Contenu à venir...",
    },
    {
      id: "reservations",
      title: "Réservations",
      icon: "📅",
      description: "Guide des réservations et calendrier",
      content: "Contenu à venir...",
    },
    {
      id: "reports",
      title: "Rapports",
      icon: "📊",
      description: "Génération et gestion des rapports",
      content: "Contenu à venir...",
    },
    {
      id: "authentication",
      title: "Authentification",
      icon: "🔐",
      description: "Connexion et gestion de compte",
      content: "Contenu à venir...",
    },
    {
      id: "dashboard",
      title: "Tableau de Bord",
      icon: "📈",
      description: "Vue d'ensemble et analytics",
      content: "Contenu à venir...",
    },
    {
      id: "settings",
      title: "Paramètres",
      icon: "⚙️",
      description: "Configuration et préférences",
      content: "Contenu à venir...",
    },
  ];

  const filteredCategories = helpCategories.filter(
    (cat) =>
      cat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-3">
        <HelpCircle className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Aide Intelligente
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Trouvez les réponses à vos questions sur l'utilisation de la plateforme
          </p>
        </div>
      </div>

      {/* Barre de recherche */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Rechercher dans l'aide
          </CardTitle>
          <CardDescription>
            Tapez un mot-clé pour trouver l'aide dont vous avez besoin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Ex: réservation, véhicule, rapport..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </CardContent>
      </Card>

      {/* Catégories d'aide */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.length > 0 ? (
          filteredCategories.map((category) => (
            <Card
              key={category.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className="text-3xl">{category.icon}</span>
                      {category.title}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {category.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  {category.content}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-3">
            <CardContent className="text-center py-8">
              <p className="text-gray-500">
                Aucun résultat trouvé pour "{searchQuery}"
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Questions Fréquemment Posées
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-l-4 border-blue-500 pl-4 py-2">
            <p className="font-semibold text-gray-900 dark:text-white">
              Comment créer une réservation?
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Allez dans la section Réserver, sélectionnez un véhicule, choisissez vos dates et cliquez sur Réserver.
            </p>
          </div>

          <div className="border-l-4 border-blue-500 pl-4 py-2">
            <p className="font-semibold text-gray-900 dark:text-white">
              Comment générer un rapport?
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Naviguez vers Rapports, sélectionnez une date, et cliquez sur Générer pour voir les données du jour.
            </p>
          </div>

          <div className="border-l-4 border-blue-500 pl-4 py-2">
            <p className="font-semibold text-gray-900 dark:text-white">
              Comment modifier mon profil?
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Cliquez sur Paramètres dans le menu de gauche pour accéder à vos informations de profil.
            </p>
          </div>

          <div className="border-l-4 border-blue-500 pl-4 py-2">
            <p className="font-semibold text-gray-900 dark:text-white">
              Quels rôles d'utilisateur existent?
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Il existe 3 rôles: Admin (accès complet), Contrôleur (gestion des véhicules et rapports), et Utilisateur normal (réservations).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Support Contact */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
            <MessageSquare className="w-5 h-5" />
            Besoin d'aide supplémentaire?
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 dark:text-blue-200">
          <p>
            Si vous avez une question qui ne figure pas ici, consultez la documentation complète ou contactez l'équipe de support via le chat.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
