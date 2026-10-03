/**
 * Design Tokens Configuration
 * Defines semantic design tokens for light and dark modes:
 * - background, surface, surface-elevated
 * - border
 * - text-primary, text-secondary, text-muted
 * - primary, primary-foreground
 * - accent, accent-foreground
 * - success, warning, danger, ring
 */

export interface ThemeTokens {
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  borderSubtle: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryForeground: string;
  accent: string;
  accentForeground: string;
  success: string;
  warning: string;
  danger: string;
  ring: string;
}

export const lightTokens: ThemeTokens = {
  background: '#ffffff',
  surface: '#f8fafc',
  surfaceElevated: '#ffffff',
  border: '#e2e8f0',
  borderSubtle: '#f1f5f9',
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  primary: '#0b1120',
  primaryForeground: '#ffffff',
  accent: '#0284c7',
  accentForeground: '#ffffff',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  ring: '#0284c7',
};

export const darkTokens: ThemeTokens = {
  background: '#0b1120', // deep navy surface, not pure black
  surface: '#0f172a',    // elevated surface slightly lighter
  surfaceElevated: '#1e293b', // modals, dropdowns, floating cards
  border: '#1e293b',
  borderSubtle: '#141e33',
  textPrimary: '#f8fafc', // soft off-white text
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  primary: '#38bdf8',
  primaryForeground: '#0b1120',
  accent: '#0284c7',
  accentForeground: '#ffffff',
  success: '#34d399',
  warning: '#fbbf24',
  danger: '#f87171',
  ring: '#38bdf8',
};

/**
 * Injects dynamic brand primary and accent colors as CSS variables
 */
export function applyBrandThemeVariables(
  isDark: boolean,
  primaryColor?: string,
  accentColor?: string,
  primaryColorDark?: string,
  accentColorDark?: string
) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  const activePrimary = isDark
    ? primaryColorDark || (primaryColor ? '#38bdf8' : darkTokens.primary)
    : primaryColor || lightTokens.primary;

  const activeAccent = isDark
    ? accentColorDark || accentColor || darkTokens.accent
    : accentColor || lightTokens.accent;

  root.style.setProperty('--brand-primary', activePrimary);
  root.style.setProperty('--brand-accent', activeAccent);
}
