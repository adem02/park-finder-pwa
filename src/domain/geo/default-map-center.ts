import { Coordinates } from './coordinates';

/**
 * Centre de la carte quand la position est indisponible : Paris.
 * L'app est faite pour être utilisée avec la localisation ; ce centre n'est qu'un repli.
 */
export const DEFAULT_MAP_CENTER = Coordinates.fromSnapshot({
  latitude: 48.8566,
  longitude: 2.3522,
});
