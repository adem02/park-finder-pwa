import type { SpotCount } from '@domain/availability/spot-count';
import type { Coordinates } from '@domain/geo/coordinates';
import type { ParkingDetails } from '@domain/parking/parking-details';
import type { ParkingId, ParkingSummary } from '@domain/parking/parking-summary';
import type { ParkingFilters } from '@domain/search/parking-filters';
import type { Result } from '@domain/shared/result';
import type { GatewayError } from '../errors/gateway.errors';

export interface NearbyQuery {
  readonly center: Coordinates;
  /** Rayon, critères et tri : la gateway les applique comme l'API. */
  readonly filters: ParkingFilters;
}

export interface ParkingGateway {
  /** Les plus proches dans le rayon (limite selon le rayon), puis filtrés et triés selon `filters`. */
  findNearby(
    query: NearbyQuery,
    signal?: AbortSignal,
  ): Promise<Result<ParkingSummary[], GatewayError>>;

  getDetails(id: ParkingId, signal?: AbortSignal): Promise<Result<ParkingDetails, GatewayError>>;

  reportAvailability(id: ParkingId, spots: SpotCount): Promise<Result<void, GatewayError>>;
}
