import type { ParkingId } from '@domain/parking/parking-summary';
import type { Result } from '@domain/shared/result';
import type { GatewayError } from '../errors/gateway.errors';
import type { ParkingGateway } from '../ports/parking.gateway';

/** Retire une photo qu'on a postée ; les points qu'elle avait rapportés sont repris. */
export class RemoveParkingPhoto {
  constructor(private readonly parkings: ParkingGateway) {}

  execute(parkingId: ParkingId, photoId: string): Promise<Result<void, GatewayError>> {
    return this.parkings.removePhoto(parkingId, photoId);
  }
}
