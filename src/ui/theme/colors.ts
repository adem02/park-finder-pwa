import type { PinState } from '@domain/parking/pin-state';

/**
 * Couleurs du DS pour les API qui ne lisent pas le CSS (styles MapLibre).
 * Garder aligné sur tokens.css.
 */
export const Colors = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  muted: '#9ca3af',
  surface: '#ffffff',
} as const;

export const PIN_COLORS: Readonly<Record<PinState, string>> = {
  recent: Colors.success,
  stale: Colors.warning,
  full: Colors.danger,
  unknown: Colors.muted,
};
