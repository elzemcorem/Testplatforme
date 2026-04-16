import { useState } from "react";
import { cn } from "./ui/utils";
import { 
  LayoutDashboard, 
  BarChart3, 
  Settings, 
  FileText, 
  User,
  Car,
  X,
  MessageSquare,
  LogOut,
  UserCog,
  ClipboardList,
  Users,
  UserPlus,
  CheckSquare
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const { currentUser, logout, switchAccount, getAllAccounts } = useAuth();

  const allAccounts = getAllAccounts();

  const handleNavigationClick = (pageId: string) => {
    if (!isExpanded) {
      setIsExpanded(true);
      // Delay the page change to allow expansion animation
      setTimeout(() => onPageChange(pageId), 150);
    } else {
      onPageChange(pageId);
    }
  };
  
  // Navigation différente selon le rôle
  const getNavigationItems = () => {
    if (!currentUser) return [];
    
    const { role } = currentUser;
    
    if (role === "admin") {
      return [
        {
          id: "dashboard",
          name: "Dashboard",
          icon: LayoutDashboard,
          description: "Overview & monitoring"
        },
        {
          id: "reservations",
          name: "Réservations",
          icon: ClipboardList,
          description: "Voir les réservations"
        },
        {
          id: "analytics",
          name: "Analytics", 
          icon: BarChart3,
          description: "Advanced analytics"
        },
        {
          id: "configuration",
          name: "Configuration",
          icon: Settings,
          description: "System settings"
        },
        {
          id: "reports",
          name: "Reports",
          icon: FileText,
          description: "Generate reports"
        },
        {
          id: "accounts",
          name: "Gestion de comptes",
          icon: Users,
          description: "Manage user accounts"
        },
        {
          id: "chat",
          name: "Chat",
          icon: MessageSquare,
          description: "Discussion en temps réel"
        },
        {
          id: "settings",
          name: "Settings & Profile",
          icon: User,
          description: "User preferences"
        }
      ];
    }
    
    if (role === "controller") {
      return [
        {
          id: "dashboard",
          name: "Dashboard",
          icon: LayoutDashboard,
          description: "Overview & monitoring"
        },
        {
          id: "reservations",
          name: "Réservations",
          icon: ClipboardList,
          description: "Manage reservations"
        },
        {
          id: "configuration",
          name: "Configuration",
          icon: Settings,
          description: "Gérer les véhicules"
        },
        {
          id: "checklist",
          name: "Checklist",
          icon: CheckSquare,
          description: "Fiches d'état véhicules"
        },
        {
          id: "reports",
          name: "Rapports",
          icon: FileText,
          description: "Générer des rapports"
        },
        {
          id: "chat",
          name: "Chat",
          icon: MessageSquare,
          description: "Discussion en temps réel"
        },
        {
          id: "settings",
          name: "Settings & Profile",
          icon: User,
          description: "User preferences"
        }
      ];
    }
    
    // Utilisateur normal
    return [
      {
        id: "dashboard",
        name: "Réserver",
        icon: Car,
        description: "Réserver un véhicule"
      },
      {
        id: "reservations",
        name: "Mes Réservations",
        icon: ClipboardList,
        description: "Voir mes réservations"
      },
      {
        id: "chat",
        name: "Chat",
        icon: MessageSquare,
        description: "Discussion en temps réel"
      },
      {
        id: "settings",
        name: "Paramètres",
        icon: Settings,
        description: "User preferences"
      }
    ];
  };

  const navigationItems = getNavigationItems();

  const handleLogout = () => {
    logout();
    setShowAccountMenu(false);
  };

  return (
    <div className="ml-6 my-6">
      <div 
        className={cn(
          "flex flex-col h-[calc(100vh-3rem)] transition-all duration-300 ease-in-out rounded-3xl",
          "bg-gradient-to-b from-sidebar via-sidebar to-sidebar-accent shadow-2xl border border-sidebar-border/20 overflow-hidden",
          isExpanded ? "w-64" : "w-20"
        )}
      >
        {/* Header with Logo */}
        <div className="p-6 flex flex-col items-center relative">
          {/* Close button when expanded */}
          {isExpanded && (
            <button
              onClick={() => setIsExpanded(false)}
              className="absolute top-4 right-4 w-8 h-8 bg-sidebar-accent/50 hover:bg-sidebar-accent rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
            >
              <X className="w-4 h-4 text-sidebar-foreground" />
            </button>
          )}
          
          <div className="w-12 h-12 bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 rounded-full flex items-center justify-center shadow-lg">
            <Car className="w-6 h-6 text-sidebar-primary-foreground" />
          </div>
          {isExpanded && (
            <div className="mt-3 text-center">
              <h2 className="text-sidebar-foreground font-semibold text-base whitespace-nowrap">
                Bénin Petro
              </h2>
              <p className="text-sidebar-foreground/70 text-xs whitespace-nowrap mt-1">
                Location de véhicules
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6">
          <div className="space-y-4">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              
              return (
                <div key={item.id} className="relative group">
                  <button
                    onClick={() => handleNavigationClick(item.id)}
                    className={cn(
                      "transition-all duration-300 flex items-center relative overflow-hidden",
                      "hover:scale-110 hover:shadow-lg",
                      isExpanded 
                        ? "w-full px-4 py-3 justify-start rounded-xl" 
                        : "w-12 h-12 justify-center mx-auto rounded-full",
                      isActive
                        ? "bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 shadow-lg shadow-sidebar-primary/30 scale-105"
                        : "bg-gradient-to-br from-sidebar-accent to-sidebar-accent/80 hover:from-sidebar-primary/80 hover:to-sidebar-primary/60"
                    )}
                  >
                    <Icon className={cn(
                      "transition-colors duration-300 flex-shrink-0",
                      "w-5 h-5",
                      isActive 
                        ? "text-sidebar-primary-foreground" 
                        : "text-sidebar-accent-foreground group-hover:text-sidebar-primary-foreground"
                    )} />
                    
                    {isExpanded && (
                      <div className="ml-3 overflow-hidden">
                        <div className={cn(
                          "font-medium text-sm whitespace-nowrap transition-colors duration-300",
                          isActive 
                            ? "text-sidebar-primary-foreground" 
                            : "text-sidebar-accent-foreground group-hover:text-sidebar-primary-foreground"
                        )}>
                          {item.name}
                        </div>
                        {isActive && (
                          <div className="text-xs text-sidebar-primary-foreground/70 mt-0.5 whitespace-nowrap">
                            {item.description}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Active indicator */}
                    {isActive && !isExpanded && (
                      <>
                        <div className="absolute inset-0 rounded-full bg-sidebar-primary opacity-20 animate-pulse" />
                        <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-1 h-6 bg-sidebar-primary rounded-l-full" />
                      </>
                    )}
                    
                    {/* Active indicator for expanded state */}
                    {isActive && isExpanded && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-sidebar-primary-foreground rounded-full animate-pulse" />
                    )}
                  </button>

                  {/* Tooltip for collapsed state */}
                  {!isExpanded && (
                    <div className="absolute left-full ml-4 px-3 py-2 bg-gradient-to-br from-sidebar-primary to-sidebar-primary/90 text-sidebar-primary-foreground rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 shadow-lg transform translate-x-2 group-hover:translate-x-0">
                      <div className="font-medium text-sm">{item.name}</div>
                      <div className="text-xs opacity-75 mt-1">{item.description}</div>
                      {/* Tooltip arrow */}
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-sidebar-primary rotate-45" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        {/* User Profile Section */}
        <div className="p-4 flex justify-center">
          <Popover open={showAccountMenu} onOpenChange={setShowAccountMenu}>
            <PopoverTrigger asChild>
              <div className="relative group">
                <div 
                  className="w-12 h-12 bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-300 cursor-pointer"
                >
                  <span className="text-sidebar-primary-foreground font-semibold text-lg">
                    {currentUser?.initials || "LG"}
                  </span>
                </div>
                
                {/* Profile tooltip for collapsed state */}
                {!isExpanded && !showAccountMenu && (
                  <div className="absolute left-full ml-4 px-3 py-2 bg-gradient-to-br from-sidebar-primary to-sidebar-primary/90 text-sidebar-primary-foreground rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 shadow-lg transform translate-x-2 group-hover:translate-x-0">
                    <div className="font-medium text-sm">{currentUser?.name || "Utilisateur"}</div>
                    <div className="text-xs opacity-75 mt-1">Cliquez pour gérer le compte</div>
                    {/* Tooltip arrow */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-sidebar-primary rotate-45" />
                  </div>
                )}
                
                {/* Profile info for expanded state */}
                {isExpanded && (
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 text-center pointer-events-none">
                    <div className="text-sidebar-foreground font-medium text-sm whitespace-nowrap">
                      {currentUser?.name || "Utilisateur"}
                    </div>
                    <div className="text-sidebar-foreground/70 text-xs whitespace-nowrap">
                      {currentUser?.role === "admin" ? "Administrateur" : 
                       currentUser?.role === "controller" ? "Contrôleur" : "Utilisateur"}
                    </div>
                  </div>
                )}
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="end" side="right" sideOffset={16}>
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      {currentUser?.initials || "LG"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{currentUser?.name || "Utilisateur"}</p>
                    <p className="text-sm text-muted-foreground truncate">{currentUser?.email}</p>
                  </div>
                </div>
                
                <Separator className="my-2" />
                
                {/* Tous les comptes connectés */}
                {allAccounts.length > 1 && (
                  <>
                    <div className="px-2 py-1.5">
                      <p className="text-xs font-medium text-muted-foreground">Changer de compte</p>
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {allAccounts
                        .filter(account => account.id !== currentUser?.id)
                        .map((account) => (
                          <Button
                            key={account.id}
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => {
                              switchAccount(account.id);
                              setShowAccountMenu(false);
                            }}
                          >
                            <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mr-2">
                              <span className="text-primary font-semibold text-xs">
                                {account.initials}
                              </span>
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <p className="text-sm font-medium truncate">{account.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{account.email}</p>
                            </div>
                          </Button>
                        ))}
                    </div>
                    <Separator className="my-2" />
                  </>
                )}
                
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      logout();
                      setShowAccountMenu(false);
                    }}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Ajouter un compte
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      onPageChange("settings");
                      setShowAccountMenu(false);
                    }}
                  >
                    <UserCog className="w-4 h-4 mr-2" />
                    Paramètres du compte
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Se déconnecter
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}