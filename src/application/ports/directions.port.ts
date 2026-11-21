import type { Coordinates } from '@domain/geo/coordinates';

export type NavigationApp = 'google-maps' | 'waze' | 'apple-plans';

export interface DirectionsLink {
  readonly app: NavigationApp;
  readonly label: string;
  readonly url: string;
}

/** Liens d'itinéraire vers une destination, dans les applis de navigation proposées sur cet appareil. */
export interface DirectionsPort {
  linksTo(destination: Coordinates, label: string): DirectionsLink[];
}
