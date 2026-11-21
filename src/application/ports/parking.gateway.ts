import type { Coordinates } from '@domain/geo/coordinates';
import type { SearchRadius } from '@domain/geo/search-radius';
import type { ParkingSummary } from '@domain/parking/parking-summary';
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
}
