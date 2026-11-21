import type { SpotCount } from '@domain/availability/spot-count';
import type { Coordinates } from '@domain/geo/coordinates';
import type { SearchRadius } from '@domain/geo/search-radius';
import type { ParkingDetails } from '@domain/parking/parking-details';
import type { ParkingId, ParkingSummary } from '@domain/parking/parking-summary';
import type { Result } from '@domain/shared/result';
import type { GatewayError } from '../errors/gateway.errors';

export interface NearbyQuery {
  readonly center: Coordinates;
  readonly radius: SearchRadius;
}

export interface ParkingGateway {
  /** Parkings dans le rayon, triés du plus proche au plus loin. */
  findNearby(
    query: NearbyQuery,
    signal?: AbortSignal,
  ): Promise<Result<ParkingSummary[], GatewayError>>;

  getDetails(id: ParkingId, signal?: AbortSignal): Promise<Result<ParkingDetails, GatewayError>>;

  reportAvailability(id: ParkingId, spots: SpotCount): Promise<Result<void, GatewayError>>;
}
