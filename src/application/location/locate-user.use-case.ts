import type { Coordinates } from '@domain/geo/coordinates';
import { DEFAULT_MAP_CENTER } from '@domain/geo/default-map-center';
import type { GeolocationError, GeolocationPort } from '../ports/geolocation.port';

export type UserLocation =
  | { readonly source: 'device'; readonly position: Coordinates }
  | {
      readonly source: 'fallback';
      readonly position: Coordinates;
      readonly reason: GeolocationError['reason'];
    };

/**
 * Position de l'utilisateur. N'échoue jamais : sans localisation,
 * on se replie sur le centre par défaut (Paris) et on dit pourquoi.
 */
export class LocateUser {
  constructor(private readonly geolocation: GeolocationPort) {}

  async execute(): Promise<UserLocation> {
    const result = await this.geolocation.currentPosition();

    return result.ok
      ? { source: 'device', position: result.value }
      : { source: 'fallback', position: DEFAULT_MAP_CENTER, reason: result.error.reason };
  }
}
