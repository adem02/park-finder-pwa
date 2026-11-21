import { GeolocationError, type GeolocationPort } from '@application/ports/geolocation.port';
import { Coordinates } from '@domain/geo/coordinates';
import { err, ok, type Result } from '@domain/shared/result';

/** Codes de GeolocationPositionError : 1 refusé, 2 indisponible, 3 délai dépassé. */
const REASON_BY_CODE: Record<number, GeolocationError['reason']> = {
  1: 'denied',
  2: 'unavailable',
  3: 'timeout',
};

export class BrowserGeolocation implements GeolocationPort {
  constructor(
    private readonly geolocation: Geolocation | undefined = globalThis.navigator?.geolocation,
  ) {}

  currentPosition(): Promise<Result<Coordinates, GeolocationError>> {
    const { geolocation } = this;
    if (!geolocation) return Promise.resolve(err(new GeolocationError('unsupported')));

    return new Promise((resolve) => {
      geolocation.getCurrentPosition(
        (position) => {
          const coordinates = Coordinates.create(
            position.coords.latitude,
            position.coords.longitude,
          );
          resolve(coordinates.ok ? ok(coordinates.value) : err(new GeolocationError('unavailable')));
        },
        (error) => resolve(err(new GeolocationError(REASON_BY_CODE[error.code] ?? 'unavailable'))),
        { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
      );
    });
  }
}
