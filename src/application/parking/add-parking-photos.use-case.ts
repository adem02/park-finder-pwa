import type { ParkingDetails } from '@domain/parking/parking-details';
import { err, type Result } from '@domain/shared/result';
import { API_ERROR_CODES } from '../auth/auth.errors';
import { ConflictError, type GatewayError } from '../errors/gateway.errors';
import type { ParkingGateway } from '../ports/parking.gateway';
import type { PreparedPhoto } from '../ports/photo-processor.port';

/** Le parking a déjà ses 3 photos (ou les aurait dépassées avec celles-ci). */
export class ParkingPhotosFullError extends Error {
  readonly kind = 'ParkingPhotosFull';

  constructor() {
    super('Ce parking a déjà toutes ses photos.');
    this.name = 'ParkingPhotosFullError';
  }
}

export type AddParkingPhotosError = ParkingPhotosFullError | GatewayError;

/** N'importe quel utilisateur ajoute des photos à un parking (3 au plus) : 5 points chacune. */
export class AddParkingPhotos {
  constructor(private readonly parkings: ParkingGateway) {}

  async execute(
    parking: ParkingDetails,
    photos: readonly PreparedPhoto[],
  ): Promise<Result<void, AddParkingPhotosError>> {
    if (photos.length > parking.remainingPhotoSlots) return err(new ParkingPhotosFullError());

    const result = await this.parkings.addPhotos(parking.id, photos);
    if (
      !result.ok &&
      result.error instanceof ConflictError &&
      result.error.code === API_ERROR_CODES.parkingPhotosFull
    ) {
      return err(new ParkingPhotosFullError());
    }
    return result;
  }
}
