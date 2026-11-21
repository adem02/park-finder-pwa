import type { ParkingDetails } from '@domain/parking/parking-details';
import type { ParkingId } from '@domain/parking/parking-summary';
import type { Result } from '@domain/shared/result';
import type { GatewayError } from '../errors/gateway.errors';
import type { ParkingGateway } from '../ports/parking.gateway';

export class GetParkingDetails {
  constructor(private readonly parkings: ParkingGateway) {}

  execute(id: ParkingId, signal?: AbortSignal): Promise<Result<ParkingDetails, GatewayError>> {
    return this.parkings.getDetails(id, signal);
  }
}
