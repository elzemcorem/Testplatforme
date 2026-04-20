/**
 * Future Bookings Help & Guide
 * Informations et guide d'utilisation des réservations futures
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "./ui/alert";
import {
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  Lock,
  Users,
} from "lucide-react";

export function FutureBookingsGuide() {
  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Titre */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2 mb-2">
          <Calendar className="w-8 h-8" />
          Guide des Réservations Futures
        </h1>
        <p className="text-muted-foreground">
          Apprenez à réserver des véhicules à l'avance pour vos besoins futurs
        </p>
      </div>

      {/* Info principale */}
      <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
        <Lightbulb className="h-4 w-4" />
        <AlertTitle>Qu'est-ce qu'une réservation future?</AlertTitle>
        <AlertDescription>
          Une réservation future vous permet de planifier l'utilisation d'un véhicule pour les jours, semaines ou mois à venir. 
          Le véhicule reste disponible pour d'autres utilisateurs jusqu'à la date de début de votre réservation.
        </AlertDescription>
      </Alert>

      {/* Avantages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Avantages
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex gap-3">
              <Calendar className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold">Planification à long terme</h4>
                <p className="text-sm text-muted-foreground">
                  Réservez de 1 jour à plusieurs mois à l'avance
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Clock className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold">Flexibilité de durée</h4>
                <p className="text-sm text-muted-foreground">
                  Choisissez la durée exacte: jours, semaines ou mois
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Lock className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold">Garantie de disponibilité</h4>
                <p className="text-sm text-muted-foreground">
                  Sécurisez le véhicule pour vos dates importantes
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Users className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold">Partage de ressources</h4>
                <p className="text-sm text-muted-foreground">
                  Autres utilisateurs peuvent utiliser le véhicule après vos dates
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mode d'emploi */}
      <Card>
        <CardHeader>
          <CardTitle>Comment faire une réservation future?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            {[
              {
                step: 1,
                title: "Accédez à Réservations Futures",
                description: "Cliquez sur 'Réservations Futures' dans le menu latéral"
              },
              {
                step: 2,
                title: "Sélectionnez un véhicule",
                description: "Choisissez parmi les véhicules disponibles avec barre d'utilisation"
              },
              {
                step: 3,
                title: "Choisissez la date de début",
                description: "Sélectionnez le jour où vous aurez besoin du véhicule"
              },
              {
                step: 4,
                title: "Définissez la durée",
                description: "Utilisez les boutons rapides (1 jour, 1 semaine, 1 mois) ou définissez une durée personnalisée"
              },
              {
                step: 5,
                title: "Ajoutez des notes (optionnel)",
                description: "Indiquez l'objectif de la réservation: 'Inspection de site', 'Transport de personnel', etc."
              },
              {
                step: 6,
                title: "Confirmez la réservation",
                description: "Cliquez sur 'Réserver' pour valider votre demande"
              }
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                  {item.step}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Options de durée */}
      <Card>
        <CardHeader>
          <CardTitle>Options de durée disponibles</CardTitle>
          <CardDescription>
            Choisissez la durée qui convient le mieux à vos besoins
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: "1 jour", value: "24h" },
              { label: "1 semaine", value: "7 jours" },
              { label: "2 semaines", value: "14 jours" },
              { label: "1 mois", value: "30 jours" },
              { label: "3 mois", value: "90 jours" },
              { label: "Personnalisé", value: "N jours" }
            ].map((option) => (
              <div key={option.label} className="p-3 border rounded-lg">
                <p className="font-semibold text-sm">{option.label}</p>
                <p className="text-xs text-muted-foreground">{option.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Statuts de réservation */}
      <Card>
        <CardHeader>
          <CardTitle>Statuts des réservations</CardTitle>
          <CardDescription>
            Comprenez les différents statuts de vos réservations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            {
              badge: "En attente",
              color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200",
              description: "Votre réservation a été créée et attend confirmation"
            },
            {
              badge: "Confirmée",
              color: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200",
              description: "La réservation est confirmée et le véhicule est réservé pour vous"
            },
            {
              badge: "Commencée",
              color: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200",
              description: "La période de réservation a commencé"
            },
            {
              badge: "Terminée",
              color: "bg-slate-100 dark:bg-slate-900/30 text-slate-800 dark:text-slate-200",
              description: "La période de réservation est terminée"
            },
            {
              badge: "Annulée",
              color: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200",
              description: "La réservation a été annulée et le véhicule est libéré"
            }
          ].map((status) => (
            <div key={status.badge} className="flex gap-3">
              <div className={`px-2 py-1 rounded text-xs font-semibold ${status.color}`}>
                {status.badge}
              </div>
              <p className="text-sm text-muted-foreground flex-1">{status.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Points importants */}
      <Alert className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Points importants</AlertTitle>
        <AlertDescription asChild>
          <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
            <li>Vous pouvez annuler une réservation future tant que la date n'a pas commencé</li>
            <li>Les réservations sont automatiquement confirmées lors de la création</li>
            <li>Le véhicule devient indisponible à partir de la date de début confirmée</li>
            <li>Vous pouvez réserver le même véhicule plusieurs fois pour des périodes différentes</li>
            <li>Les autres utilisateurs voient les dates non disponibles lors de la sélection</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>Questions fréquentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            {
              q: "Puis-je modifier une réservation future?",
              a: "Oui, vous pouvez annuler et créer une nouvelle réservation avec les dates modifiées."
            },
            {
              q: "Combien de réservations futures puis-je faire?",
              a: "Pas de limite! Vous pouvez réserver autant de fois que nécessaire."
            },
            {
              q: "Que se passe-t-il si quelqu'un a besoin du véhicule à mes dates?",
              a: "Les réservations futures garantissent que le véhicule est réservé pour vous. Les autres utilisateurs ne peuvent pas réserver ces dates."
            },
            {
              q: "Puis-je réserver un véhicule pour plus d'un an?",
              a: "Oui, vous pouvez réserver pour une durée aussi longue que nécessaire."
            }
          ].map((item, idx) => (
            <div key={idx} className="space-y-2">
              <p className="font-semibold text-sm">{item.q}</p>
              <p className="text-sm text-muted-foreground">{item.a}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
