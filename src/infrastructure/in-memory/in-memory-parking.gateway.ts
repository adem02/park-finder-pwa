import { NotFoundError, type GatewayError } from '@application/errors/gateway.errors';
import type { Clock } from '@application/ports/clock.port';
import type { NearbyQuery, ParkingGateway } from '@application/ports/parking.gateway';
import { Availability } from '@domain/availability/availability';
import type { SpotCount } from '@domain/availability/spot-count';
import type { ParkingDetails } from '@domain/parking/parking-details';
import type { ParkingId, ParkingSummary } from '@domain/parking/parking-summary';
import { err, ok, type Result } from '@domain/shared/result';
import { InMemoryParkingStore } from './in-memory-parking.store';

/** Gateway en mémoire : tests et mode démo. Mêmes règles que l'API (rayon, tri, limite). */
export class InMemoryParkingGateway implements ParkingGateway {
  constructor(
    private readonly store: InMemoryParkingStore,
    private readonly clock: Clock,
  ) {}

  findNearby({ center, radius }: NearbyQuery): Promise<Result<ParkingSummary[], GatewayError>> {
    const nearby = this.store
      .all()
      .map((record) =>
        InMemoryParkingStore.toSummary(record, center.distanceTo(record.coordinates)),
      )
      .filter((parking) => radius.contains(parking.distanceMeters))
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .slice(0, radius.maxResults);

    return Promise.resolve(ok(nearby));
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
    return Promise.resolve(ok(undefined));
  }
}
