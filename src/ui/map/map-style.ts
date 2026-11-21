import type { CircleLayerSpecification } from 'maplibre-gl';
import { Colors, PIN_COLORS } from '../theme/colors';

/** Style OpenFreeMap : gratuit, sans clé (attribution OpenStreetMap incluse). */
export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

export const DEFAULT_ZOOM = 14;
export const FOCUS_ZOOM = 15;

export const PARKINGS_SOURCE_ID = 'parkings';
export const PARKING_PINS_LAYER_ID = 'parking-pins';

export const parkingPinsLayer: CircleLayerSpecification = {
  id: PARKING_PINS_LAYER_ID,
  type: 'circle',
  source: PARKINGS_SOURCE_ID,
  paint: {
    'circle-color': [
      'match',
      ['get', 'pinState'],
      'recent',
      PIN_COLORS.recent,
      'stale',
      PIN_COLORS.stale,
      'full',
      PIN_COLORS.full,
      PIN_COLORS.unknown,
    ],
    'circle-radius': ['case', ['get', 'selected'], 12, 8],
    'circle-stroke-width': ['case', ['get', 'selected'], 3, 2],
    'circle-stroke-color': ['case', ['get', 'selected'], Colors.primary, Colors.surface],
  },
};
