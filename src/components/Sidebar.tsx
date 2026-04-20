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
  CheckSquare,
  ClipboardCheck,
  HelpCircle,
  Calendar
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { themeService } from "../services/themeService";
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

// Fonctions utilitaires
const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0, 0, 0';
};

const adjustBrightness = (color: string, percent: number): string => {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (
    0x1000000 +
    (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)
  ).toString(16).slice(1);
};

export function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const { currentUser, logout, switchAccount, getAllAccounts } = useAuth();
  const colors = themeService.getCurrentColors();
  const scheme = themeService.getCurrentScheme();
  const isChromatic = scheme === 'chromatic';

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
    
    const { role, isDAF } = currentUser;
    
    // DAF a son propre menu spécialisé
    if (isDAF) {
      return [
        {
          id: "dashboard",
          name: "Dashboard DAF",
          icon: BarChart3,
          description: "Suivi temps réel"
        },
        {
          id: "reservations",
          name: "Réservations",
          icon: ClipboardList,
          description: "Gérer les réservations"
        },
        {
          id: "exit-reports",
          name: "Rapports de Sortie",
          icon: FileText,
          description: "Voir les rapports"
        },
        {
          id: "chat",
          name: "Chat",
          icon: MessageSquare,
          description: "Messages"
        },
        {
          id: "settings",
          name: "Paramètres",
          icon: Settings,
          description: "Vos préférences"
        }
      ];
    }
    
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
          id: "future-bookings",
          name: "Réservations Futures",
          icon: Calendar,
          description: "Réserver à l'avance"
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
          id: "help",
          name: "Aide",
          icon: HelpCircle,
          description: "Aide intelligente"
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
          id: "future-bookings",
          name: "Réservations Futures",
          icon: Calendar,
          description: "Réserver à l'avance"
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
          id: "exit-reports",
          name: "Rapports de Sortie",
          icon: ClipboardCheck,
          description: "Rapports de sortie véhicules"
        },
        {
          id: "chat",
          name: "Chat",
          icon: MessageSquare,
          description: "Discussion en temps réel"
        },
        {
          id: "help",
          name: "Aide",
          icon: HelpCircle,
          description: "Aide intelligente"
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
        id: "future-bookings",
        name: "Réservations Futures",
        icon: Calendar,
        description: "Réserver à l'avance"
      },
      {
        id: "chat",
        name: "Chat",
        icon: MessageSquare,
        description: "Discussion en temps réel"
      },
      {
        id: "help",
        name: "Aide",
        icon: HelpCircle,
        description: "Aide intelligente"
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
          "flex flex-col h-[calc(100vh-3rem)] transition-all duration-300 ease-in-out rounded-3xl overflow-hidden",
          isExpanded ? "w-64" : "w-20"
        )}
        style={{
          background: isChromatic 
            ? `linear-gradient(180deg, rgba(${hexToRgb(colors.primary)}, 0.08) 0%, rgba(${hexToRgb(colors.secondary)}, 0.04) 100%)`
            : `linear-gradient(to bottom, ${colors.background}95, ${colors.background}85)`,
          borderColor: isChromatic ? `${colors.primary}20` : `${colors.primary}40`,
          boxShadow: isChromatic 
            ? `0 20px 25px -5px rgba(${hexToRgb(colors.primary)}, 0.1)`
            : `0 20px 25px -5px rgba(0, 0, 0, 0.1)`,
          border: `1px solid ${isChromatic ? `${colors.primary}15` : `${colors.primary}30`}`,
        }}
      >
        {/* Header with Logo */}
        <div className="p-6 flex flex-col items-center relative">
          {/* Close button when expanded */}
          {isExpanded && (
            <button
              onClick={() => setIsExpanded(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
              style={{
                backgroundColor: `${colors.primary}30`,
                color: colors.primary,
              }}
            >
              <X className="w-4 h-4" />
            </button>
          )}
          
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
            style={{
              background: `linear-gradient(to br, ${colors.primary}, ${adjustBrightness(colors.primary, -20)})`,
            }}
          >
            <Car className="w-6 h-6 text-white" />
          </div>
          {isExpanded && (
            <div className="mt-3 text-center">
              <h2 
                className="font-semibold text-base whitespace-nowrap"
                style={{ color: colors.foreground }}
              >
                Bénin Petro
              </h2>
              <p 
                className="text-xs whitespace-nowrap mt-1"
                style={{ color: `${colors.foreground}80` }}
              >
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
                      isChromatic && "chromatic-nav-item"
                    )}
                    style={{
                      backgroundColor: isActive
                        ? colors.primary
                        : `${colors.primary}15`,
                      color: colors.foreground,
                      boxShadow: isActive && isChromatic
                        ? `0 4px 12px rgba(${hexToRgb(colors.primary)}, 0.3)`
                        : 'none',
                    }}
                  >
                    <Icon 
                      className="w-5 h-5 flex-shrink-0 transition-colors duration-300"
                      style={{
                        color: isActive ? 'white' : colors.primary,
                      }}
                    />
                    
                    {isExpanded && (
                      <div className="ml-3 overflow-hidden">
                        <div
                          className="font-medium text-sm whitespace-nowrap transition-colors duration-300"
                          style={{
                            color: isActive ? 'white' : colors.foreground,
                          }}
                        >
                          {item.name}
                        </div>
                        {isActive && (
                          <div
                            className="text-xs mt-0.5 whitespace-nowrap"
                            style={{
                              color: isActive ? 'rgba(255, 255, 255, 0.7)' : `${colors.foreground}70`,
                            }}
                          >
                            {item.description}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Active indicator */}
                    {isActive && !isExpanded && (
                      <>
                        <div 
                          className="absolute inset-0 rounded-full animate-pulse"
                          style={{
                            backgroundColor: `${colors.primary}20`,
                          }}
                        />
                        <div 
                          className="absolute -right-2 top-1/2 -translate-y-1/2 w-1 h-6 rounded-l-full"
                          style={{
                            backgroundColor: colors.primary,
                          }}
                        />
                      </>
                    )}
                    
                    {/* Active indicator for expanded state */}
                    {isActive && isExpanded && (
                      <div 
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full animate-pulse"
                        style={{
                          backgroundColor: 'white',
                        }}
                      />
                    )}
                  </button>

                  {/* Tooltip for collapsed state */}
                  {!isExpanded && (
                    <div
                      className="absolute left-full ml-4 px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 shadow-lg transform translate-x-2 group-hover:translate-x-0"
                      style={{
                        background: `linear-gradient(to br, ${colors.primary}, ${colors.secondary})`,
                        color: 'white',
                      }}
                    >
                      <div className="font-medium text-sm">{item.name}</div>
                      <div className="text-xs opacity-75 mt-1">{item.description}</div>
                      {/* Tooltip arrow */}
                      <div 
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 rotate-45"
                        style={{
                          backgroundColor: colors.primary,
                        }}
                      />
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
                  className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-300 cursor-pointer"
                  style={{
                    background: `linear-gradient(to br, ${colors.primary}, ${adjustBrightness(colors.primary, -20)})`,
                  }}
                >
                  <span className="text-white font-semibold text-lg">
                    {currentUser?.initials || "LG"}
                  </span>
                </div>
                
                {/* Profile tooltip for collapsed state */}
                {!isExpanded && !showAccountMenu && (
                  <div
                    className="absolute left-full ml-4 px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 shadow-lg transform translate-x-2 group-hover:translate-x-0"
                    style={{
                      background: `linear-gradient(to br, ${colors.primary}, ${colors.secondary})`,
                      color: 'white',
                    }}
                  >
                    <div className="font-medium text-sm">{currentUser?.name || "Utilisateur"}</div>
                    <div className="text-xs opacity-75 mt-1">Cliquez pour gérer le compte</div>
                    {/* Tooltip arrow */}
                    <div 
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 rotate-45"
                      style={{
                        backgroundColor: colors.primary,
                      }}
                    />
                  </div>
                )}
                
                {/* Profile info for expanded state */}
                {isExpanded && (
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 text-center pointer-events-none">
                    <div
                      className="font-medium text-sm whitespace-nowrap"
                      style={{ color: colors.foreground }}
                    >
                      {currentUser?.name || "Utilisateur"}
                    </div>
                    <div
                      className="text-xs whitespace-nowrap"
                      style={{ color: `${colors.foreground}80` }}
                    >
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
                      if (window.confirm('Vous allez être déconnecté. Veuillez vous reconnecter avec un autre compte.')) {
                        logout();
                        setShowAccountMenu(false);
                      }
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