import { API_ERROR_CODES } from '@application/auth/auth.errors';
import { ConflictError, NotFoundError, ServerError, type GatewayError } from '@application/errors/gateway.errors';
import type { Clock } from '@application/ports/clock.port';
import type { NearbyQuery, ParkingGateway } from '@application/ports/parking.gateway';
import type { PreparedPhoto } from '@application/ports/photo-processor.port';
import { Availability } from '@domain/availability/availability';
import type { SpotCount } from '@domain/availability/spot-count';
import { DUPLICATE_PARKING_RADIUS_METERS, type NewParking } from '@domain/parking/new-parking';
import type { ParkingDetails } from '@domain/parking/parking-details';
import type { ParkingId, ParkingSummary } from '@domain/parking/parking-summary';
import { err, ok, type Result } from '@domain/shared/result';
import { DEMO_USER, InMemoryParkingStore } from './in-memory-parking.store';

/** Gateway en mémoire : tests et mode démo. Mêmes règles que l'API : les N plus proches, puis filtres et tri. */
export class InMemoryParkingGateway implements ParkingGateway {
  constructor(
    private readonly store: InMemoryParkingStore,
    private readonly clock: Clock,
  ) {}

  findNearby({ center, filters }: NearbyQuery): Promise<Result<ParkingSummary[], GatewayError>> {
    const { radius } = filters;
    const nearest = this.store
      .all()
      .map((record) =>
        InMemoryParkingStore.toSummary(record, center.distanceTo(record.coordinates)),
      )
      .filter((parking) => radius.contains(parking.distanceMeters))
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .slice(0, radius.maxResults);

    return Promise.resolve(ok(filters.apply(nearest, this.clock.now())));
  }

  getDetails(id: ParkingId): Promise<Result<ParkingDetails, GatewayError>> {
    const record = this.store.find(id);
    return Promise.resolve(
      record ? ok(InMemoryParkingStore.toDetails(record)) : err(new NotFoundError()),
    );
  }

  reportAvailability(id: ParkingId, spots: SpotCount): Promise<Result<void, GatewayError>> {
    if (!this.store.find(id)) return Promise.resolve(err(new NotFoundError()));

    this.store.update(id, { availability: Availability.reported(spots.value, this.clock.now()) });
    this.store.recordReport();
    return Promise.resolve(ok(undefined));
  }

  add(parking: NewParking, photos: readonly PreparedPhoto[]): Promise<Result<ParkingId, GatewayError>> {
    const tooClose = this.store
      .all()
      .some((record) => parking.coordinates.distanceTo(record.coordinates) <= DUPLICATE_PARKING_RADIUS_METERS);
    // Comme l'API : 409 ParkingAlreadyExistsException.
    if (tooClose) {
      return Promise.resolve(
        err(new ConflictError('A parking already exists near the provided coordinates.', API_ERROR_CODES.parkingExists)),
      );
    }

    const id = `added-${this.store.all().length + 1}-${this.clock.now().getTime()}`;
    this.store.insert({
      id,
      name: parking.name,
      totalSpots: parking.totalSpots,
      // En démo, les aperçus locaux tiennent lieu de photos hébergées.
      photos: photos.map((photo) => photo.previewUrl),
      coordinates: parking.coordinates,
      addedBy: DEMO_USER,
      availability: Availability.none(),
      upvotes: 0,
      downvotes: 0,
      userVote: null,
      comments: [],
      createdAt: this.clock.now(),
    });
    return Promise.resolve(ok(id));
  }

  /** Comme l'API : auteur seulement (403), et tant que personne d'autre n'a voté ni commenté (409). */
  delete(id: ParkingId): Promise<Result<void, GatewayError>> {
    const record = this.store.find(id);
    if (!record) return Promise.resolve(err(new NotFoundError()));
    if (record.addedBy.id !== DEMO_USER.id) return Promise.resolve(err(new ServerError(403)));

    const ownVote = record.userVote ? 1 : 0;
    const othersVoted = record.upvotes + record.downvotes - ownVote > 0;
    const othersCommented = record.comments.some((comment) => comment.author.id !== DEMO_USER.id);
    if (othersVoted || othersCommented) {
      return Promise.resolve(
        err(
          new ConflictError(
            'Other users have contributed to this parking: it can no longer be deleted.',
            API_ERROR_CODES.parkingHasContributions,
          ),
        ),
      );
    }

    this.store.remove(id);
    return Promise.resolve(ok(undefined));
  }
}
