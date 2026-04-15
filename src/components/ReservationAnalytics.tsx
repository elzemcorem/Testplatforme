import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Download, TrendingUp, Car, Calendar, DollarSign } from "lucide-react";
import { useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export function ReservationAnalytics() {
  const [period, setPeriod] = useState("month");
  const [vehicleType, setVehicleType] = useState("all");

  // Données de réservations mensuelles
  const monthlyData = [
    { month: "Jan", reservations: 45, revenue: 2250000 },
    { month: "Fév", reservations: 52, revenue: 2600000 },
    { month: "Mar", reservations: 48, revenue: 2400000 },
    { month: "Avr", reservations: 61, revenue: 3050000 },
    { month: "Mai", reservations: 55, revenue: 2750000 },
    { month: "Juin", reservations: 67, revenue: 3350000 },
    { month: "Juil", reservations: 72, revenue: 3600000 },
    { month: "Août", reservations: 68, revenue: 3400000 },
    { month: "Sep", reservations: 59, revenue: 2950000 },
    { month: "Oct", reservations: 64, revenue: 3200000 },
    { month: "Nov", reservations: 70, revenue: 3500000 },
    { month: "Déc", reservations: 75, revenue: 3750000 },
  ];

  // Données par type de véhicule
  const vehicleTypeData = [
    { name: "Berline", value: 35, color: "#10b981" },
    { name: "SUV", value: 28, color: "#3b82f6" },
    { name: "Minibus", value: 20, color: "#f59e0b" },
    { name: "Luxe", value: 17, color: "#8b5cf6" },
  ];

  // Données de taux d'occupation
  const occupancyData = [
    { day: "Lun", rate: 75 },
    { day: "Mar", rate: 68 },
    { day: "Mer", rate: 82 },
    { day: "Jeu", rate: 77 },
    { day: "Ven", rate: 90 },
    { day: "Sam", rate: 95 },
    { day: "Dim", rate: 85 },
  ];

  return (
    <div className="p-6 space-y-6 bg-background min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Statistiques détaillées de réservations et performances
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Exporter les données
        </Button>
      </div>

      {/* Filters Section */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Filtres d'analyse
          </CardTitle>
          <CardDescription>
            Configurez vos paramètres d'analyse
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Période</label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="border-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Cette semaine</SelectItem>
                  <SelectItem value="month">Ce mois</SelectItem>
                  <SelectItem value="quarter">Ce trimestre</SelectItem>
                  <SelectItem value="year">Cette année</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Type de véhicule</label>
              <Select value={vehicleType} onValueChange={setVehicleType}>
                <SelectTrigger className="border-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="sedan">Berline</SelectItem>
                  <SelectItem value="suv">SUV</SelectItem>
                  <SelectItem value="van">Minibus</SelectItem>
                  <SelectItem value="luxury">Luxe</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Réservations totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">756</p>
                <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-4 h-4" />
                  +12.5% ce mois
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenus mensuels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">3.75M</p>
                <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-4 h-4" />
                  +8.2% ce mois
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taux d'occupation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">82%</p>
                <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-4 h-4" />
                  +5.1% ce mois
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Flotte totale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">20</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Véhicules actifs
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Car className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Réservations et Revenus */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle>Évolution des réservations et revenus</CardTitle>
            <CardDescription>Tendances mensuelles de l'année en cours</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="reservations"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.3}
                  name="Réservations"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                  name="Revenus (FCFA)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Répartition par type de véhicule */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle>Répartition par type de véhicule</CardTitle>
            <CardDescription>Distribution des réservations par catégorie</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={vehicleTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {vehicleTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Taux d'occupation hebdomadaire */}
        <Card className="border-2 border-primary/20 lg:col-span-2">
          <CardHeader>
            <CardTitle>Taux d'occupation hebdomadaire</CardTitle>
            <CardDescription>Performance quotidienne de la semaine</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={occupancyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="rate" fill="#10b981" name="Taux d'occupation (%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary Table */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle>Résumé des performances</CardTitle>
          <CardDescription>Comparaison mensuelle des métriques clés</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Mois</th>
                  <th className="text-right py-3 px-4">Réservations</th>
                  <th className="text-right py-3 px-4">Revenus (FCFA)</th>
                  <th className="text-right py-3 px-4">Variation</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.slice(-6).reverse().map((month) => (
                  <tr key={month.month} className="border-b hover:bg-accent/50">
                    <td className="py-3 px-4 font-medium">{month.month}</td>
                    <td className="text-right py-3 px-4">{month.reservations}</td>
                    <td className="text-right py-3 px-4">
                      {month.revenue.toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-4">
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        +{Math.floor(Math.random() * 10 + 5)}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}