/**
 * État d'un pin sur la carte (DS « Sémantique des pins », avec l'expiration à 15 min de docs/decisions.md) :
 * - recent  : places signalées il y a moins de 10 min (vert)
 * - stale   : places signalées il y a 10 à 15 min (orange)
 * - full    : signalé plein, signalement non expiré (rouge)
 * - unknown : aucun signalement valide (gris)
 */
export type PinState = 'recent' | 'stale' | 'full' | 'unknown';

export const PIN_STATES: readonly PinState[] = ['recent', 'stale', 'full', 'unknown'];
