/**
 * MapLibre (~280 Ko compressés, plus son worker) n'est téléchargé que pour afficher une carte :
 * connexion, onboarding, liste et détail s'affichent sans l'attendre.
 * L'import dynamique est mis en cache par le navigateur : l'appeler plusieurs fois ne coûte rien.
 */
export const loadMapView = () => import('./map-view');

/** Précharge la carte quand le navigateur est inactif, pour qu'elle soit prête au passage sur l'onglet. */
export function preloadMapViewWhenIdle(): () => void {
  const preload = () => void loadMapView();
  if (typeof globalThis.requestIdleCallback === 'function') {
    const id = globalThis.requestIdleCallback(preload, { timeout: 5000 });
    return () => globalThis.cancelIdleCallback(id);
  }
  const id = globalThis.setTimeout(preload, 2000);
  return () => globalThis.clearTimeout(id);
}
