import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Users, Shield, UserCheck, UserX, Ban, RefreshCw } from "lucide-react";
import { User } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner@2.0.3";
import { supabase, profilesApi, Profile, UserRole } from "../lib/supabase";

/** Convertit un Profile Supabase en User local */
function mapProfile(p: Profile): User {
  return {
    id:       p.id,
    email:    p.email,
    name:     p.name,
    role:     p.role,
    initials: p.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2),
    status:   p.status as User["status"],
    isOnline: p.is_online,
    lastSeen: p.last_seen ? new Date(p.last_seen) : new Date(),
  };
}

export function AccountManagement() {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();

  // ── Chargement initial ──────────────────────────────────────────────
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    const { data, error } = await profilesApi.getAll();
    if (error) {
      toast.error("Erreur", { description: "Impossible de charger les utilisateurs." });
    } else {
      setAllUsers((data ?? []).map(mapProfile));
    }
    setIsLoading(false);
  };

  // ── Supabase Realtime Presence — statut en ligne ────────────────────
  useEffect(() => {
    if (!currentUser) return;

    const presenceChannel = supabase.channel("online-users", {
      config: { presence: { key: currentUser.id } },
    });

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState<{ user_id: string }>();
        const onlineIds = new Set(
          Object.values(state).flat().map((p) => p.user_id)
        );
        setAllUsers((prev) =>
          prev.map((u) => ({ ...u, isOnline: onlineIds.has(u.id) }))
        );
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({ user_id: currentUser.id });
        }
      });

    return () => {
      presenceChannel.untrack();
      supabase.removeChannel(presenceChannel);
    };
  }, [currentUser]);

  // ── Supabase Realtime — changements de profils ──────────────────────
  useEffect(() => {
    const channel = supabase
      .channel("profiles-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            const updated = mapProfile(payload.new as Profile);
            setAllUsers((prev) =>
              prev.map((u) => (u.id === updated.id ? updated : u))
            );
          }
          if (payload.eventType === "INSERT") {
            setAllUsers((prev) => [...prev, mapProfile(payload.new as Profile)]);
          }
          if (payload.eventType === "DELETE") {
            setAllUsers((prev) =>
              prev.filter((u) => u.id !== (payload.old as Profile).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ── Changer le statut d'un utilisateur ─────────────────────────────
  const updateUserStatus = async (userId: string, newStatus: User["status"]) => {
    const { error } = await supabase
      .from("profiles")
      .update({ status: newStatus })
      .eq("id", userId);

    if (error) {
      toast.error("Erreur", { description: "Impossible de modifier le statut." });
      return;
    }

    const user = allUsers.find((u) => u.id === userId);
    if (user) {
      const label =
        newStatus === "active"
          ? "activé"
          : newStatus === "restricted"
          ? "restreint"
          : "banni";
      toast.success("Statut modifié", {
        description: `Le compte de ${user.name} a été ${label}.`,
      });
    }
  };

  // ── Changer le rôle d'un utilisateur ───────────────────────────────
  const updateUserRole = async (userId: string, newRole: UserRole) => {
    const { error } = await profilesApi.setRole(userId, newRole);
    if (error) {
      toast.error("Erreur", { description: "Impossible de modifier le rôle." });
      return;
    }
    const user = allUsers.find((u) => u.id === userId);
    if (user) {
      toast.success("Rôle modifié", {
        description: `${user.name} est maintenant ${newRole}.`,
      });
    }
  };

  // ── Badges ──────────────────────────────────────────────────────────
  const getRoleBadge = (role: User["role"]) => {
    switch (role) {
      case "admin":
        return (
          <Badge className="bg-purple-500 hover:bg-purple-600">
            <Shield className="w-3 h-3 mr-1" />Admin
          </Badge>
        );
      case "controller":
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600">
            <UserCheck className="w-3 h-3 mr-1" />Contrôleur
          </Badge>
        );
      case "user":
        return (
          <Badge variant="secondary">
            <Users className="w-3 h-3 mr-1" />Utilisateur
          </Badge>
        );
    }
  };

  const getStatusBadge = (status: User["status"]) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500 hover:bg-green-600">Actif</Badge>;
      case "restricted":
        return <Badge className="bg-orange-500 hover:bg-orange-600">Restreint</Badge>;
      case "banned":
        return <Badge variant="destructive">Banni</Badge>;
    }
  };

  // ── Stats ───────────────────────────────────────────────────────────
  const onlineUsers     = allUsers.filter((u) => u.isOnline);
  const restrictedUsers = allUsers.filter((u) => u.status === "restricted");
  const bannedUsers     = allUsers.filter((u) => u.status === "banned");

  return (
    <div className="p-6 space-y-6 bg-background min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Gestion des comptes</h1>
          <p className="text-muted-foreground mt-1">
            Gérez les utilisateurs et leurs accès — synchronisé en temps réel
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadUsers} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total utilisateurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{allUsers.length}</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En ligne
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-500">{onlineUsers.length}</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Restreints
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-500">{restrictedUsers.length}</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Bannis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-500">{bannedUsers.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des utilisateurs */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Tous les utilisateurs
          </CardTitle>
          <CardDescription>
            Gérez les accès et les permissions de chaque utilisateur
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">Chargement…</p>
            ) : allUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Aucun utilisateur enregistré
              </p>
            ) : (
              allUsers
                .sort((a, b) => (b.isOnline ? 1 : 0) - (a.isOnline ? 1 : 0))
                .map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white">
                            {user.initials}
                          </AvatarFallback>
                        </Avatar>
                        {user.isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{user.name}</p>
                          {user.id === currentUser?.id && (
                            <Badge variant="outline" className="text-xs">Vous</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex items-center gap-2">
                          {getRoleBadge(user.role)}
                          {getStatusBadge(user.status)}
                          {user.isOnline && (
                            <Badge
                              variant="outline"
                              className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 text-xs"
                            >
                              En ligne
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {user.id !== currentUser?.id && (
                      <div className="flex items-center gap-2">
                        {/* Changer le rôle */}
                        <Select
                          value={user.role}
                          onValueChange={(value) =>
                            updateUserRole(user.id, value as UserRole)
                          }
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-muted-foreground" />
                                Utilisateur
                              </div>
                            </SelectItem>
                            <SelectItem value="controller">
                              <div className="flex items-center gap-2">
                                <UserCheck className="w-4 h-4 text-blue-500" />
                                Contrôleur
                              </div>
                            </SelectItem>
                            <SelectItem value="admin">
                              <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4 text-purple-500" />
                                Admin
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        {/* Changer le statut */}
                        <Select
                          value={user.status}
                          onValueChange={(value) =>
                            updateUserStatus(user.id, value as User["status"])
                          }
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">
                              <div className="flex items-center gap-2">
                                <UserCheck className="w-4 h-4 text-green-500" />
                                Actif
                              </div>
                            </SelectItem>
                            <SelectItem value="restricted">
                              <div className="flex items-center gap-2">
                                <UserX className="w-4 h-4 text-orange-500" />
                                Restreindre
                              </div>
                            </SelectItem>
                            <SelectItem value="banned">
                              <div className="flex items-center gap-2">
                                <Ban className="w-4 h-4 text-red-500" />
                                Bannir
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
