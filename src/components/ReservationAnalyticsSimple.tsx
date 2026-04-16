import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Download, TrendingUp, Car, Calendar, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import {
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

export function ReservationAnalyticsSimple() {
  const [period, setPeriod] = useState("day");
  const [vehicleType, setVehicleType] = useState("all");
  const [reservations, setReservations] = useState<any[]>([]);

  useEffect(() => {
    loadReservations();
    const interval = setInterval(loadReservations, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadReservations = () => {
    const stored = localStorage.getItem("reservations");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const reservationsWithDates = parsed.map((res: any) => ({
          ...res,
          startDate: new Date(res.startDate),
          endDate: new Date(res.endDate),
          createdAt: new Date(res.createdAt),
        }));
        setReservations(reservationsWithDates);
      } catch (error) {
        console.error("Error loading reservations:", error);
      }
    }
  };

  // Données d'évolution des réservations selon la période sélectionnée
  const getReservationData = () => {
    const now = new Date();
    
    if (period === "day") {
      // Dernières 24 heures par heure
      const data = [];
      for (let i = 23; i >= 0; i--) {
        const hour = new Date(now);
        hour.setHours(hour.getHours() - i);
        const count = reservations.filter((res) => {
          const resHour = new Date(res.createdAt);
          return resHour.getHours() === hour.getHours() && 
                 resHour.getDate() === hour.getDate();
        }).length;
        data.push({
          time: `${hour.getHours()}h`,
          reservations: count,
        });
      }
      return data;
    }

    if (period === "hours10") {
      // Dernières 10 heures
      const data = [];
      for (let i = 9; i >= 0; i--) {
        const hour = new Date(now);
        hour.setHours(hour.getHours() - i);
        const count = reservations.filter((res) => {
          const resHour = new Date(res.createdAt);
          return resHour.getHours() === hour.getHours() && 
                 resHour.getDate() === hour.getDate();
        }).length;
        data.push({
          time: `${hour.getHours()}h`,
          reservations: count,
        });
      }
      return data;
    }

    // Par jour (derniers 7 jours)
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(day.getDate() - i);
      const count = reservations.filter((res) => {
        const resDay = new Date(res.createdAt);
        return resDay.toDateString() === day.toDateString();
      }).length;
      data.push({
        time: day.toLocaleDateString('fr-FR', { weekday: 'short' }),
        reservations: count,
      });
    }
    return data;
  };

  // Données par type de véhicule
  const getVehicleTypeData = () => {
    const types = ["Toyota Corolla", "Honda CR-V", "Toyota Hiace"];
    const colors = ["#10b981", "#3b82f6", "#f59e0b"];
    
    return types.map((type, index) => ({
      name: type,
      value: reservations.filter((res) => res.vehicleName === type).length,
      color: colors[index],
    }));
  };

  const reservationData = getReservationData();
  const vehicleTypeData = getVehicleTypeData();

  const totalReservations = reservations.length;
  const pendingReservations = reservations.filter((r) => r.status === "pending").length;
  const validatedReservations = reservations.filter((r) => r.status === "validated").length;
  const cancelledReservations = reservations.filter((r) => r.status === "cancelled").length;

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
                  <SelectItem value="hours10">Dernières 10 heures</SelectItem>
                  <SelectItem value="day">Dernières 24 heures</SelectItem>
                  <SelectItem value="week">7 derniers jours</SelectItem>
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
                  <SelectItem value="corolla">Toyota Corolla</SelectItem>
                  <SelectItem value="crv">Honda CR-V</SelectItem>
                  <SelectItem value="hiace">Toyota Hiace</SelectItem>
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
                <p className="text-3xl font-bold">{totalReservations}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Toutes périodes
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-orange-500">{pendingReservations}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  À valider
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Validées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-green-500">{validatedReservations}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Actives
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                <Car className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Annulées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-red-500">{cancelledReservations}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Total
                </p>
              </div>
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolution des réservations */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle>Évolution des réservations</CardTitle>
            <CardDescription>
              {period === "hours10" ? "10 dernières heures" : period === "day" ? "24 dernières heures" : "7 derniers jours"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reservationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="time" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="reservations"
                  stroke="#16a34a"
                  strokeWidth={3}
                  dot={{ fill: "#16a34a", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Répartition par type de véhicule */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle>Répartition par véhicule</CardTitle>
            <CardDescription>
              Distribution des réservations par véhicule
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={vehicleTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {vehicleTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle>Statistiques détaillées</CardTitle>
          <CardDescription>
            Informations complémentaires sur les réservations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Taux d'acceptation</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">
                  {totalReservations > 0
                    ? Math.round((validatedReservations / totalReservations) * 100)
                    : 0}
                  %
                </p>
                <p className="text-sm text-green-600">
                  {validatedReservations}/{totalReservations} validées
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Taux d'annulation</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-red-500">
                  {totalReservations > 0
                    ? Math.round((cancelledReservations / totalReservations) * 100)
                    : 0}
                  %
                </p>
                <p className="text-sm text-red-600">
                  {cancelledReservations}/{totalReservations} annulées
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Véhicule le plus réservé</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">
                  {vehicleTypeData.reduce((max, v) => (v.value > max.value ? v : max), vehicleTypeData[0])?.name || "N/A"}
                </p>
                <p className="text-sm text-primary">
                  {vehicleTypeData.reduce((max, v) => (v.value > max.value ? v : max), vehicleTypeData[0])?.value || 0} réservations
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
