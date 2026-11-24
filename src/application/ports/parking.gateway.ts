import type { SpotCount } from '@domain/availability/spot-count';
import type { Coordinates } from '@domain/geo/coordinates';
import type { NewParking } from '@domain/parking/new-parking';
import type { ParkingDetails } from '@domain/parking/parking-details';
import type { ParkingId, ParkingSummary } from '@domain/parking/parking-summary';
import type { ParkingFilters } from '@domain/search/parking-filters';
import type { Result } from '@domain/shared/result';
import type { GatewayError } from '../errors/gateway.errors';
import type { PreparedPhoto } from './photo-processor.port';

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

  /** Crée le parking avec ses photos (0 à 3) ; rend son identifiant. */
  add(parking: NewParking, photos: readonly PreparedPhoto[]): Promise<Result<ParkingId, GatewayError>>;

  /** Ajoute des photos à un parking existant (3 au plus en tout). */
  addPhotos(id: ParkingId, photos: readonly PreparedPhoto[]): Promise<Result<void, GatewayError>>;

  /** Retire une photo postée par l'utilisateur. */
  removePhoto(id: ParkingId, photoId: string): Promise<Result<void, GatewayError>>;

  /** Retire un parking de son auteur (refusé par l'API si d'autres y ont contribué). */
  delete(id: ParkingId): Promise<Result<void, GatewayError>>;
}
