/**
 * Service de gestion des thèmes et couleurs globales
 * Gère les palettes de couleurs personnalisables
 */

export type ColorScheme = 'blue' | 'red' | 'purple' | 'ash' | 'yellow' | 'chromatic';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
}

export const colorSchemes: Record<ColorScheme, ThemeColors> = {
  blue: {
    primary: '#2563eb',
    secondary: '#3b82f6',
    accent: '#60a5fa',
    background: '#f0f9ff',
    foreground: '#001f3f',
  },
  red: {
    primary: '#dc2626',
    secondary: '#ef4444',
    accent: '#f87171',
    background: '#fef2f2',
    foreground: '#7f1d1d',
  },
  purple: {
    primary: '#9333ea',
    secondary: '#a855f7',
    accent: '#c084fc',
    background: '#faf5ff',
    foreground: '#3f0f5c',
  },
  ash: {
    primary: '#6b7280',
    secondary: '#9ca3af',
    accent: '#d1d5db',
    background: '#f9fafb',
    foreground: '#111827',
  },
  yellow: {
    primary: '#eab308',
    secondary: '#facc15',
    accent: '#fde047',
    background: '#fefce8',
    foreground: '#713f12',
  },
  chromatic: {
    primary: '#8b5cf6',
    secondary: '#ec4899',
    accent: '#06b6d4',
    background: '#f3f0ff',
    foreground: '#4c1d95',
  },
};

class ThemeService {
  private storageKey = 'user_color_scheme';

  /**
   * Obtenir le schéma de couleur actuel
   */
  getCurrentScheme(): ColorScheme {
    const stored = localStorage.getItem(this.storageKey);
    return (stored as ColorScheme) || 'blue';
  }

  /**
   * Obtenir les couleurs du schéma actuel
   */
  getCurrentColors(): ThemeColors {
    const scheme = this.getCurrentScheme();
    return colorSchemes[scheme];
  }

  /**
   * Définir un nouveau schéma de couleur
   */
  setColorScheme(scheme: ColorScheme): void {
    localStorage.setItem(this.storageKey, scheme);
    this.applyColorScheme(scheme);
  }

  /**
   * Appliquer le schéma de couleur au DOM
   */
  applyColorScheme(scheme: ColorScheme): void {
    const colors = colorSchemes[scheme];
    const root = document.documentElement;

    // Variables CSS pour Tailwind
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-secondary', colors.secondary);
    root.style.setProperty('--color-accent', colors.accent);
    root.style.setProperty('--color-background', colors.background);
    root.style.setProperty('--color-foreground', colors.foreground);

    // Appliquer les classes Tailwind dynamiquement
    this.updateTailwindColors(scheme);
  }

  /**
   * Mettre à jour les couleurs Tailwind
   */
  private updateTailwindColors(scheme: ColorScheme): void {
    const colors = colorSchemes[scheme];
    const root = document.documentElement;

    // Créer ou mettre à jour la feuille de style
    let styleId = 'dynamic-theme-styles';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    // CSS avec les couleurs personnalisées
    styleElement.textContent = `
      :root {
        --primary: ${colors.primary};
        --secondary: ${colors.secondary};
        --accent: ${colors.accent};
        --bg-custom: ${colors.background};
        --fg-custom: ${colors.foreground};
      }

      .theme-primary {
        color: ${colors.primary};
      }

      .theme-primary-bg {
        background-color: ${colors.primary};
      }

      .theme-primary-border {
        border-color: ${colors.primary};
      }

      .theme-secondary {
        color: ${colors.secondary};
      }

      .theme-secondary-bg {
        background-color: ${colors.secondary};
      }

      .theme-accent {
        color: ${colors.accent};
      }

      .theme-accent-bg {
        background-color: ${colors.accent};
      }

      /* Gradients personnalisés */
      .theme-gradient {
        background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%);
      }

      .theme-gradient-light {
        background: linear-gradient(135deg, ${colors.background} 0%, ${colors.accent}20 100%);
      }

      /* Boutons */
      .theme-btn-primary {
        background-color: ${colors.primary};
        color: white;
      }

      .theme-btn-primary:hover {
        background-color: ${this.adjustBrightness(colors.primary, -20)};
      }

      /* Cartes */
      .theme-card {
        border-color: ${colors.primary}33;
        background: linear-gradient(135deg, ${colors.background} 0%, transparent 100%);
      }

      /* Texte */
      .theme-text-primary {
        color: ${colors.primary};
      }

      .theme-text-secondary {
        color: ${colors.secondary};
      }
    `;
  }

  /**
   * Ajuster la luminosité d'une couleur hex
   */
  private adjustBrightness(color: string, percent: number): string {
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
  }

  /**
   * Initialiser le thème au chargement
   */
  initializeTheme(): void {
    const scheme = this.getCurrentScheme();
    this.applyColorScheme(scheme);
  }

  /**
   * Obtenir tous les schémas disponibles
   */
  getAvailableSchemes(): ColorScheme[] {
    return Object.keys(colorSchemes) as ColorScheme[];
  }

  /**
   * Obtenir le label pour un schéma
   */
  getSchemeLabel(scheme: ColorScheme): string {
    const labels: Record<ColorScheme, string> = {
      blue: '🔵 Bleu',
      red: '🔴 Rouge',
      purple: '🟣 Violet',
      ash: '⚫ Cendre',
      yellow: '🟡 Jaune',
      chromatic: '🌈 Chromatique',
    };
    return labels[scheme];
  }
}

export const themeService = new ThemeService();
