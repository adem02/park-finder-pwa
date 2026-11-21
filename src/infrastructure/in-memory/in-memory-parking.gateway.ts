import type { GatewayError } from '@application/errors/gateway.errors';
import type { NearbyQuery, ParkingGateway } from '@application/ports/parking.gateway';
import type { ParkingSummary } from '@domain/parking/parking-summary';
import { ok, type Result } from '@domain/shared/result';

/** Gateway en mémoire : tests, mode démo et Storybook. Mêmes règles que l'API (rayon, tri, limite). */
export class InMemoryParkingGateway implements ParkingGateway {
  constructor(private readonly parkings: readonly ParkingSummary[]) {}

  findNearby({ center, radius }: NearbyQuery): Promise<Result<ParkingSummary[], GatewayError>> {
    const nearby = this.parkings
      .map((parking) => parking.withDistance(center.distanceTo(parking.coordinates)))
      .filter((parking) => radius.contains(parking.distanceMeters))
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .slice(0, radius.maxResults);

    return Promise.resolve(ok(nearby));
  }
}
