import type { InvalidReportError } from '@domain/availability/spot-count';
import type { ParkingDetails } from '@domain/parking/parking-details';
import { ok, type Result } from '@domain/shared/result';
import type { GatewayError } from '../errors/gateway.errors';
import type { Clock } from '../ports/clock.port';
import type { ParkingGateway } from '../ports/parking.gateway';

export type ReportAvailabilityError = InvalidReportError | GatewayError;

/** Signaler le nombre de places libres. Renvoie le parking mis à jour avec ce signalement. */
export class ReportAvailability {
  constructor(
    private readonly parkings: ParkingGateway,
    private readonly clock: Clock,
  ) {}

  async execute(input: {
    parking: ParkingDetails;
    spots: number;
  }): Promise<Result<ParkingDetails, ReportAvailabilityError>> {
    const spots = input.parking.validateReportedSpots(input.spots);
    if (!spots.ok) return spots;

    const reported = await this.parkings.reportAvailability(input.parking.id, spots.value);
    if (!reported.ok) return reported;

    return ok(input.parking.withReport(spots.value, this.clock.now()));
  }
}
