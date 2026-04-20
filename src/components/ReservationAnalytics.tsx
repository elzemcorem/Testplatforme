import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Download, TrendingUp, Car, Calendar, DollarSign } from "lucide-react";
import { useState, useEffect, useMemo, useRef, memo } from "react";
import { reservationService } from "../services/reservationService";
import { toast } from "sonner";
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

// Composant chart optimisé avec memo
const OptimizedAreaChart = memo(({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={300}>
    <AreaChart data={data}>
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
));

const OptimizedPieChart = memo(({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={300}>
    <PieChart>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        labelLine={false}
        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        outerRadius={100}
        fill="#8884d8"
        dataKey="value"
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.color} />
        ))}
      </Pie>
      <Tooltip />
    </PieChart>
  </ResponsiveContainer>
));

const OptimizedBarChart = memo(({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="day" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar dataKey="rate" fill="#10b981" name="Taux d'occupation (%)" />
    </BarChart>
  </ResponsiveContainer>
));

export function ReservationAnalytics() {
  const [period, setPeriod] = useState("month");
  const [vehicleType, setVehicleType] = useState("all");
  const [reservations, setReservations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // 📡 Charger les réservations et s'abonner aux mises à jour en temps réel
  useEffect(() => {
    const loadAndSubscribe = async () => {
      try {
        // Charger les données initiales
        const loaded = await reservationService.loadReservations();
        setReservations(loaded);
        console.log("✅ Réservations chargées:", loaded.length);

        // S'abonner aux changements en temps réel
        const unsubscribe = reservationService.subscribeToReservations(
          (reservation, action) => {
            console.log(`📡 Réservation ${action}:`, reservation.id);
            setReservations((prev) => {
              if (action === "created") {
                if (prev.some((r) => r.id === reservation.id)) {
                  return prev;
                }
                return [reservation, ...prev];
              } else if (action === "updated") {
                return prev.map((r) =>
                  r.id === reservation.id ? reservation : r
                );
              } else if (action === "deleted") {
                return prev.filter((r) => r.id !== reservation.id);
              }
              return prev;
            });
          }
        );

        unsubscribeRef.current = unsubscribe;
      } catch (error) {
        console.error("❌ Erreur lors du chargement:", error);
        toast.error("Erreur lors du chargement des réservations");
      } finally {
        setIsLoading(false);
      }
    };

    loadAndSubscribe();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, []);

  // 🧮 Données mensuelles calculées en temps réel
  const monthlyData = useMemo(() => {
    const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
    const now = new Date();
    const currentYear = now.getFullYear();

    return months.map((month, index) => {
      const monthNum = index + 1;
      const monthReservations = reservations.filter((r) => {
        const resDate = new Date(r.start_date);
        return (
          resDate.getFullYear() === currentYear &&
          resDate.getMonth() === index &&
          (vehicleType === "all" || r.vehicle_type?.toLowerCase() === vehicleType)
        );
      });

      const count = monthReservations.length;
      // Utiliser une valeur de tarif standard par défaut
      const revenue = count * 50000; // 50k FCFA par réservation en moyenne

      return {
        month,
        reservations: count,
        revenue: revenue,
      };
    });
  }, [reservations, vehicleType]);

  // 📊 Distribution par type de véhicule en temps réel
  const vehicleTypeData = useMemo(() => {
    const types = ["Berline", "SUV", "Minibus", "Luxe"];
    const colorMap: { [key: string]: string } = {
      berline: "#10b981",
      suv: "#3b82f6",
      minibus: "#f59e0b",
      luxe: "#8b5cf6",
    };

    return types.map((type) => {
      const count = reservations.filter(
        (r) => r.vehicle_type?.toLowerCase() === type.toLowerCase()
      ).length;
      return {
        name: type,
        value: count,
        color: colorMap[type.toLowerCase()] || "#6b7280",
      };
    });
  }, [reservations]);

  // 📈 Taux d'occupation hebdomadaire en temps réel
  const occupancyData = useMemo(() => {
    const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
    const dayMap = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"];
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1); // Début de semaine (lundi)

    return days.map((day, index) => {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + index);

      const dayReservations = reservations.filter((r) => {
        const resDate = new Date(r.start_date);
        return (
          resDate.toDateString() === dayDate.toDateString() &&
          (r.status === "pending" || r.status === "validated")
        );
      });

      // Taux d'occupation: (réservations validées / nombre total de véhicules) * 100
      const vehicles = new Set(reservations.map((r) => r.vehicle_id)).size || 1;
      const rate = Math.min(100, Math.round((dayReservations.length / Math.max(vehicles, 1)) * 100));

      return {
        day,
        rate,
      };
    });
  }, [reservations]);

  // 🔢 KPIs calculés en temps réel
  const kpis = useMemo(() => {
    const total = reservations.length;
    const thisMonth = reservations.filter((r) => {
      const resDate = new Date(r.start_date);
      const now = new Date();
      return (
        resDate.getMonth() === now.getMonth() &&
        resDate.getFullYear() === now.getFullYear()
      );
    });

    const monthlyRevenue = thisMonth.reduce((sum, r) => sum + (r.amount || 50000), 0);
    const avgOccupancy = occupancyData.reduce((sum, d) => sum + d.rate, 0) / occupancyData.length;

    // Calcul du changement par rapport au mois précédent
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthReservations = reservations.filter((r) => {
      const resDate = new Date(r.start_date);
      return (
        resDate.getMonth() === lastMonth.getMonth() &&
        resDate.getFullYear() === lastMonth.getFullYear()
      );
    });

    const reservationChange = lastMonthReservations.length > 0
      ? (((thisMonth.length - lastMonthReservations.length) / lastMonthReservations.length) * 100).toFixed(1)
      : 0;

    const revenueChange = lastMonthReservations.length > 0
      ? ((monthlyRevenue / (lastMonthReservations.length * 50000)) * 100 - 100).toFixed(1)
      : 0;

    return {
      total,
      monthlyRevenue,
      avgOccupancy,
      fleetSize: new Set(reservations.map((r) => r.vehicle_id)).size,
      reservationChange,
      revenueChange,
    };
  }, [reservations, occupancyData]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 bg-background min-h-full">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-background min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Analytics 📊</h1>
          <p className="text-muted-foreground mt-1">
            Statistiques temps réel de réservations et performances
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
            Configurez vos paramètres d'analyse (mise à jour en temps réel)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type de véhicule</label>
              <Select value={vehicleType} onValueChange={setVehicleType}>
                <SelectTrigger className="border-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="berline">Berline</SelectItem>
                  <SelectItem value="suv">SUV</SelectItem>
                  <SelectItem value="minibus">Minibus</SelectItem>
                  <SelectItem value="luxe">Luxe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Badge className="bg-blue-100 text-blue-700">
                🔄 Temps réel activé
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs Cards - Temps réel */}
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
                <p className="text-3xl font-bold">{kpis.total}</p>
                <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-4 h-4" />
                  +{kpis.reservationChange}% ce mois
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
                <p className="text-3xl font-bold">
                  {(kpis.monthlyRevenue / 1000000).toFixed(2)}M
                </p>
                <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-4 h-4" />
                  +{kpis.revenueChange}% ce mois
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
                <p className="text-3xl font-bold">{kpis.avgOccupancy.toFixed(0)}%</p>
                <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-4 h-4" />
                  Moyenne semaine
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
                <p className="text-3xl font-bold">{kpis.fleetSize}</p>
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

      {/* Charts Section - Optimisés */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Réservations et Revenus */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle>Évolution des réservations et revenus 📈</CardTitle>
            <CardDescription>Tendances mensuelles - mise à jour temps réel</CardDescription>
          </CardHeader>
          <CardContent>
            <OptimizedAreaChart data={monthlyData} />
          </CardContent>
        </Card>

        {/* Répartition par type de véhicule */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle>Répartition par type de véhicule 🚗</CardTitle>
            <CardDescription>Distribution des réservations - temps réel</CardDescription>
          </CardHeader>
          <CardContent>
            <OptimizedPieChart data={vehicleTypeData} />
          </CardContent>
        </Card>

        {/* Taux d'occupation hebdomadaire */}
        <Card className="border-2 border-primary/20 lg:col-span-2">
          <CardHeader>
            <CardTitle>Taux d'occupation hebdomadaire 📊</CardTitle>
            <CardDescription>Performance quotidienne - mise à jour en temps réel</CardDescription>
          </CardHeader>
          <CardContent>
            <OptimizedBarChart data={occupancyData} />
          </CardContent>
        </Card>
      </div>

      {/* Summary Table */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle>Résumé des performances (12 derniers mois)</CardTitle>
          <CardDescription>Comparaison mensuelle des métriques clés - temps réel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Mois</th>
                  <th className="text-right py-3 px-4">Réservations</th>
                  <th className="text-right py-3 px-4">Revenus (FCFA)</th>
                  <th className="text-right py-3 px-4">Moyenne/Réservation</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((month) => (
                  <tr key={month.month} className="border-b hover:bg-accent/50 transition">
                    <td className="py-3 px-4 font-medium">{month.month}</td>
                    <td className="text-right py-3 px-4">{month.reservations}</td>
                    <td className="text-right py-3 px-4">
                      {month.revenue.toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-4">
                      {month.reservations > 0 ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          {(month.revenue / month.reservations).toLocaleString()} FCFA
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
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