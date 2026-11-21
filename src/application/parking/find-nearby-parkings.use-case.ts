import { Coordinates, type InvalidCoordinatesError } from '@domain/geo/coordinates';
import { SearchRadius, type InvalidSearchRadiusError } from '@domain/geo/search-radius';
import type { ParkingSummary } from '@domain/parking/parking-summary';
import { ok, type Result } from '@domain/shared/result';
import type { GatewayError } from '../errors/gateway.errors';
import type { ParkingGateway } from '../ports/parking.gateway';

export interface FindNearbyParkingsInput {
  readonly latitude: number;
  readonly longitude: number;
  /** Rayon en mètres. Par défaut : 2 km. */
  readonly radiusMeters?: number;
}

export type FindNearbyParkingsError =
  | InvalidCoordinatesError
  | InvalidSearchRadiusError
  | GatewayError;

export class FindNearbyParkings {
  constructor(private readonly parkings: ParkingGateway) {}

  async execute(
    input: FindNearbyParkingsInput,
    signal?: AbortSignal,
  ): Promise<Result<ParkingSummary[], FindNearbyParkingsError>> {
    const center = Coordinates.create(input.latitude, input.longitude);
    if (!center.ok) return center;

    const radius =
      input.radiusMeters === undefined
        ? ok(SearchRadius.DEFAULT)
        : SearchRadius.create(input.radiusMeters);
    if (!radius.ok) return radius;

    return this.parkings.findNearby({ center: center.value, radius: radius.value }, signal);
  }
}
