import { GeolocationError, type GeolocationPort } from '@application/ports/geolocation.port';
import type { Coordinates } from '@domain/geo/coordinates';
import { err, ok, type Result } from '@domain/shared/result';

export class FakeGeolocation implements GeolocationPort {
  private constructor(private readonly result: Result<Coordinates, GeolocationError>) {}

  static at(position: Coordinates): FakeGeolocation {
    return new FakeGeolocation(ok(position));
  }

  static failing(reason: GeolocationError['reason']): FakeGeolocation {
    return new FakeGeolocation(err(new GeolocationError(reason)));
  }

  currentPosition(): Promise<Result<Coordinates, GeolocationError>> {
    return Promise.resolve(this.result);
  }
}
