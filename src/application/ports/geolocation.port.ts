import type { Coordinates } from '@domain/geo/coordinates';
import type { Result } from '@domain/shared/result';

export class GeolocationError extends Error {
  readonly kind = 'Geolocation';

  constructor(readonly reason: 'denied' | 'unavailable' | 'timeout' | 'unsupported') {
    super(`Position indisponible (${reason}).`);
    this.name = 'GeolocationError';
  }
}

export interface GeolocationPort {
  currentPosition(): Promise<Result<Coordinates, GeolocationError>>;
}
