const STORAGE_KEY = 'parkfinder:onboarding-done';

/**
 * L'onboarding ne s'affiche qu'une fois par appareil. Stockage local best effort :
 * en navigation privée ou si le stockage est bloqué, il s'affiche simplement de nouveau.
 */
export const OnboardingProgress = {
  isDone(): boolean {
    try {
      return globalThis.localStorage?.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  },

  markDone(): void {
    try {
      globalThis.localStorage?.setItem(STORAGE_KEY, '1');
    } catch {
      // stockage indisponible : l'onboarding reviendra au prochain lancement, sans gravité
    }
  },
};
