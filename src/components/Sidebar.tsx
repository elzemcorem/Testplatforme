import { useState } from "react";
import { cn } from "./ui/utils";
import {
  LayoutDashboard, BarChart3, Settings, FileText, User, Car,
  MessageSquare, LogOut, UserCog, ClipboardList, Users, UserPlus,
  CheckSquare, ClipboardCheck, HelpCircle, Calendar, Save, Trash2,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { themeService } from "../services/themeService";
import { SessionAccountsManager } from "../services/sessionAccountsManager";
import { AddAccountModal } from "./AddAccountModal";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { toast } from "sonner";

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const hexToRgb = (hex: string): string => {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1], 16)}, ${parseInt(r[2], 16)}, ${parseInt(r[3], 16)}` : "0,0,0";
};

const darken = (hex: string, pct: number): string => {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * pct);
  const clamp = (v: number) => Math.min(255, Math.max(0, v));
  const R = clamp((num >> 16) + amt);
  const G = clamp(((num >> 8) & 0xff) + amt);
  const B = clamp((num & 0xff) + amt);
  return "#" + ((1 << 24) | (R << 16) | (G << 8) | B).toString(16).slice(1);
};

type NavItem = { id: string; name: string; icon: React.ElementType; description: string };

export function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [accounts, setAccounts] = useState(() => SessionAccountsManager.getSessionAccounts());

  const { currentUser, logout, switchAccount } = useAuth();
  const colors = themeService.getCurrentColors();
  const isChromatic = themeService.getCurrentScheme() === "chromatic";

  const navItems: NavItem[] = (() => {
    if (!currentUser) return [];
    const { role, isDAF } = currentUser;

    if (isDAF) return [
      { id: "dashboard",    name: "Dashboard DAF",       icon: BarChart3,      description: "Suivi temps réel" },
      { id: "reservations", name: "Réservations",        icon: ClipboardList,  description: "Gérer les réservations" },
      { id: "exit-reports", name: "Rapports de Sortie",  icon: FileText,       description: "Voir les rapports" },
      { id: "chat",         name: "Chat",                icon: MessageSquare,  description: "Messages" },
      { id: "settings",     name: "Paramètres",          icon: Settings,       description: "Vos préférences" },
    ];

    if (role === "admin") return [
      { id: "dashboard",      name: "Dashboard",            icon: LayoutDashboard, description: "Overview & monitoring" },
      { id: "reservations",   name: "Réservations",         icon: ClipboardList,   description: "Voir les réservations" },
      { id: "future-bookings",name: "Rés. Futures",         icon: Calendar,        description: "Réserver à l'avance" },
      { id: "analytics",      name: "Analytics",            icon: BarChart3,       description: "Advanced analytics" },
      { id: "configuration",  name: "Véhicules",            icon: Car,             description: "Gestion des véhicules" },
      { id: "reports",        name: "Reports",              icon: FileText,        description: "Generate reports" },
      { id: "accounts",       name: "Comptes",              icon: Users,           description: "Manage user accounts" },
      { id: "chat",           name: "Chat",                 icon: MessageSquare,   description: "Discussion en temps réel" },
      { id: "help",           name: "Aide",                 icon: HelpCircle,      description: "Aide intelligente" },
      { id: "settings",       name: "Paramètres",           icon: User,            description: "User preferences" },
    ];

    if (role === "controller") return [
      { id: "dashboard",      name: "Dashboard",         icon: LayoutDashboard, description: "Overview & monitoring" },
      { id: "reservations",   name: "Réservations",      icon: ClipboardList,   description: "Manage reservations" },
      { id: "future-bookings",name: "Rés. Futures",      icon: Calendar,        description: "Réserver à l'avance" },
      { id: "configuration",  name: "Véhicules",         icon: Car,             description: "Gestion des véhicules" },
      { id: "checklist",      name: "Checklist",         icon: CheckSquare,     description: "Fiches d'état véhicules" },
      { id: "reports",        name: "Rapports",          icon: FileText,        description: "Générer des rapports" },
      { id: "exit-reports",   name: "Sorties",           icon: ClipboardCheck,  description: "Rapports de sortie" },
      { id: "chat",           name: "Chat",              icon: MessageSquare,   description: "Discussion en temps réel" },
      { id: "help",           name: "Aide",              icon: HelpCircle,      description: "Aide intelligente" },
      { id: "settings",       name: "Paramètres",        icon: User,            description: "User preferences" },
    ];

    return [
      { id: "dashboard",      name: "Réserver",          icon: Car,            description: "Réserver un véhicule" },
      { id: "reservations",   name: "Mes Réservations",  icon: ClipboardList,  description: "Voir mes réservations" },
      { id: "future-bookings",name: "Futures",           icon: Calendar,       description: "Réserver à l'avance" },
      { id: "chat",           name: "Chat",              icon: MessageSquare,  description: "Discussion en temps réel" },
      { id: "help",           name: "Aide",              icon: HelpCircle,     description: "Aide intelligente" },
      { id: "settings",       name: "Paramètres",        icon: Settings,       description: "Préférences" },
    ];
  })();

  const roleLabel = currentUser?.isDAF ? "DAF"
    : currentUser?.role === "admin" ? "Administrateur"
    : currentUser?.role === "controller" ? "Contrôleur"
    : "Utilisateur";

  const primary = colors.primary;
  const primaryRgb = hexToRgb(primary);

  const cardStyle = {
    background: isChromatic
      ? `linear-gradient(180deg, rgba(${primaryRgb},0.08) 0%, rgba(${hexToRgb(colors.secondary)},0.04) 100%)`
      : `${colors.background}`,
    border: `1px solid ${isChromatic ? `${primary}18` : `${primary}28`}`,
    boxShadow: isChromatic
      ? `0 16px 40px -8px rgba(${primaryRgb},0.18)`
      : `0 4px 24px -4px rgba(0,0,0,0.10)`,
  };

  const dividerStyle = { height: 1, backgroundColor: `${primary}14` };

  const avatarStyle = {
    background: `linear-gradient(135deg, ${primary}, ${darken(primary, -18)})`,
  };

  const logoStyle = {
    background: `linear-gradient(135deg, ${primary}, ${darken(primary, -20)})`,
  };

  return (
    <div className="p-3 h-screen">
      <div
        className={cn(
          "flex flex-col h-full rounded-2xl overflow-hidden transition-[width] duration-300 ease-in-out",
          isExpanded ? "w-52" : "w-14"
        )}
        style={cardStyle}
      >
        {/* ── Logo / Toggle ── */}
        <button
          onClick={() => setIsExpanded((v) => !v)}
          className="flex items-center gap-2.5 mx-2 mt-3 mb-2 px-2 py-2 rounded-xl hover:bg-black/5 transition-colors duration-150 overflow-hidden"
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md"
            style={logoStyle}
          >
            <Car className="w-4 h-4 text-white" />
          </div>
          {isExpanded && (
            <div className="text-left overflow-hidden">
              <p className="text-sm font-semibold leading-tight whitespace-nowrap" style={{ color: colors.foreground }}>
                Bénin Petro
              </p>
              <p className="text-[11px] leading-tight whitespace-nowrap" style={{ color: `${colors.foreground}65` }}>
                Location de véhicules
              </p>
            </div>
          )}
        </button>

        <div className="mx-3" style={dividerStyle} />

        {/* ── Navigation ── */}
        <nav
          className="flex-1 min-h-0 px-2 py-2 overflow-y-auto [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none" }}
        >
          <ul className="flex flex-col gap-0.5 list-none m-0 p-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = currentPage === item.id;

              return (
                <li key={item.id} className="relative group/item">
                  <button
                    onClick={() => onPageChange(item.id)}
                    title={!isExpanded ? item.name : undefined}
                    className={cn(
                      "w-full flex items-center gap-2.5 rounded-xl transition-colors duration-150 outline-none",
                      isExpanded ? "px-3 py-2" : "w-10 h-10 mx-auto justify-center"
                    )}
                    style={{
                      backgroundColor: active ? primary : "transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!active) (e.currentTarget as HTMLButtonElement).style.backgroundColor = `${primary}16`;
                    }}
                    onMouseLeave={(e) => {
                      if (!active) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                    }}
                  >
                    <Icon
                      className="flex-shrink-0"
                      style={{ width: 17, height: 17, color: active ? "white" : primary }}
                    />
                    {isExpanded && (
                      <>
                        <span
                          className="text-sm font-medium truncate flex-1 text-left leading-tight"
                          style={{ color: active ? "white" : colors.foreground }}
                        >
                          {item.name}
                        </span>
                        {active && (
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: "rgba(255,255,255,0.65)" }}
                          />
                        )}
                      </>
                    )}
                  </button>

                  {/* Tooltip — collapsed only */}
                  {!isExpanded && (
                    <div
                      className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-xl shadow-lg pointer-events-none z-50 opacity-0 group-hover/item:opacity-100 transition-opacity duration-150 whitespace-nowrap"
                      style={{
                        background: `linear-gradient(135deg, ${primary}, ${darken(primary, -15)})`,
                        color: "white",
                      }}
                    >
                      <p className="text-xs font-semibold leading-tight">{item.name}</p>
                      <p className="text-[10px] opacity-70 leading-tight mt-0.5">{item.description}</p>
                      {/* Arrow */}
                      <span
                        className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent"
                        style={{ borderRightColor: primary }}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mx-3" style={dividerStyle} />

        {/* ── User Profile ── */}
        <div className="p-2 pb-3">
          <Popover open={showMenu} onOpenChange={setShowMenu}>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "w-full flex items-center gap-2.5 rounded-xl transition-colors duration-150 outline-none",
                  isExpanded ? "px-3 py-2" : "w-10 h-10 mx-auto justify-center"
                )}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = `${primary}14`; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold text-xs shadow"
                  style={avatarStyle}
                >
                  {currentUser?.initials || "?"}
                </div>
                {isExpanded && (
                  <>
                    <div className="flex-1 text-left overflow-hidden">
                      <p className="text-sm font-medium truncate leading-tight" style={{ color: colors.foreground }}>
                        {currentUser?.name || "Utilisateur"}
                      </p>
                      <p className="text-[11px] leading-tight truncate" style={{ color: `${colors.foreground}58` }}>
                        {roleLabel}
                      </p>
                    </div>
                    <ChevronRight
                      className="flex-shrink-0 opacity-35"
                      style={{ width: 14, height: 14, color: colors.foreground }}
                    />
                  </>
                )}
              </button>
            </PopoverTrigger>

            <PopoverContent className="w-60 p-0" align="end" side="right" sideOffset={10}>
              <div className="p-3">
                {/* Current user */}
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold text-sm shadow"
                    style={avatarStyle}
                  >
                    {currentUser?.initials || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate leading-tight">{currentUser?.name || "Utilisateur"}</p>
                    <p className="text-xs text-muted-foreground truncate">{currentUser?.email}</p>
                  </div>
                </div>

                <Separator className="my-2" />

                {/* Account switcher */}
                {accounts.length > 1 && (
                  <>
                    <p className="text-xs font-medium text-muted-foreground px-1.5 pb-1">Changer de compte</p>
                    <div
                      className="max-h-36 overflow-y-auto [&::-webkit-scrollbar]:hidden space-y-0.5"
                      style={{ scrollbarWidth: "none" }}
                    >
                      {accounts
                        .filter((a) => a.email !== currentUser?.email)
                        .map((account) => {
                          const saved = SessionAccountsManager.getSavedAccounts().some((s) => s.email === account.email);
                          return (
                            <div key={account.email} className="flex items-center group/acc">
                              <Button
                                variant="ghost"
                                className="flex-1 justify-start h-auto py-1.5 px-1.5 gap-2"
                                onClick={() => { switchAccount(account.email); setShowMenu(false); }}
                              >
                                <div
                                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold"
                                  style={{ background: `${primary}20`, color: primary }}
                                >
                                  {account.initials}
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                  <p className="text-xs font-medium truncate">{account.name}</p>
                                  <p className="text-[10px] text-muted-foreground truncate">{account.email}</p>
                                </div>
                              </Button>
                              <div className="opacity-0 group-hover/acc:opacity-100 transition-opacity flex-shrink-0">
                                {saved ? (
                                  <Button
                                    variant="ghost" size="sm"
                                    className="h-7 w-7 p-0 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950"
                                    onClick={(e) => { e.stopPropagation(); SessionAccountsManager.unsaveAccount(account.email); setAccounts(SessionAccountsManager.getSessionAccounts()); toast.info("Compte non sauvegardé"); }}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost" size="sm"
                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                                    onClick={(e) => { e.stopPropagation(); SessionAccountsManager.saveAccount({ ...account, isSaved: true }); setAccounts(SessionAccountsManager.getSessionAccounts()); toast.success("Compte sauvegardé"); }}
                                  >
                                    <Save className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                    <Separator className="my-2" />
                  </>
                )}

                {/* Actions */}
                <div className="space-y-0.5">
                  <Button variant="ghost" className="w-full justify-start h-8 text-sm gap-2"
                    onClick={() => setShowAddModal(true)}>
                    <UserPlus className="w-3.5 h-3.5" /> Ajouter un compte
                  </Button>
                  <Button variant="ghost" className="w-full justify-start h-8 text-sm gap-2"
                    onClick={() => { onPageChange("settings"); setShowMenu(false); }}>
                    <UserCog className="w-3.5 h-3.5" /> Paramètres du compte
                  </Button>
                  <Button variant="ghost"
                    className="w-full justify-start h-8 text-sm gap-2 text-red-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                    onClick={() => { logout(); setShowMenu(false); }}>
                    <LogOut className="w-3.5 h-3.5" /> Se déconnecter
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <AddAccountModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAccountAdded={() => { setAccounts(SessionAccountsManager.getSessionAccounts()); toast.success("Compte ajouté à la session!"); }}
      />
    </div>
  );
}
