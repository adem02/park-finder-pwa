import { Coordinates, type InvalidCoordinatesError } from '@domain/geo/coordinates';
import type { InvalidSearchRadiusError } from '@domain/geo/search-radius';
import type { ParkingSummary } from '@domain/parking/parking-summary';
import {
  ParkingFilters,
  type InvalidMinSpotsError,
  type ParkingFiltersInput,
} from '@domain/search/parking-filters';
import type { Result } from '@domain/shared/result';
import type { GatewayError } from '../errors/gateway.errors';
import type { ParkingGateway } from '../ports/parking.gateway';

export interface FindNearbyParkingsInput {
  readonly latitude: number;
  readonly longitude: number;
  /** Critères omis : valeurs par défaut (2 km, tous, tri par distance). */
  readonly filters?: ParkingFiltersInput;
}

export type FindNearbyParkingsError =
  | InvalidCoordinatesError
  | InvalidSearchRadiusError
  | InvalidMinSpotsError
  | GatewayError;

export class FindNearbyParkings {
  constructor(private readonly parkings: ParkingGateway) {}

  async execute(
    input: FindNearbyParkingsInput,
    signal?: AbortSignal,
  ): Promise<Result<ParkingSummary[], FindNearbyParkingsError>> {
    const center = Coordinates.create(input.latitude, input.longitude);
    if (!center.ok) return center;

    const filters = ParkingFilters.create(input.filters);
    if (!filters.ok) return filters;

    return this.parkings.findNearby({ center: center.value, filters: filters.value }, signal);
  }
}
