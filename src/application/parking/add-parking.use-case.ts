import { NewParking, type InvalidNewParkingError } from '@domain/parking/new-parking';
import type { ParkingId } from '@domain/parking/parking-summary';
import { err, type Result } from '@domain/shared/result';
import { ConflictError, NotFoundError, type GatewayError } from '../errors/gateway.errors';
import type { ParkingGateway } from '../ports/parking.gateway';
import type { PreparedPhoto } from '../ports/photo-processor.port';

export class DuplicateParkingError extends Error {
  readonly kind = 'DuplicateParking';

  constructor() {
    super('Un parking existe déjà à cet endroit.');
    this.name = 'DuplicateParkingError';
  }
}

export interface AddParkingInput {
  readonly name: string;
  readonly totalSpots: number;
  readonly latitude: number;
  readonly longitude: number;
  readonly photos: readonly PreparedPhoto[];
}

export type AddParkingError = InvalidNewParkingError | DuplicateParkingError | GatewayError;

export class AddParking {
  constructor(private readonly parkings: ParkingGateway) {}

  async execute(input: AddParkingInput): Promise<Result<ParkingId, AddParkingError>> {
    const parking = NewParking.create({ ...input, photoCount: input.photos.length });
    if (!parking.ok) return parking;

    const result = await this.parkings.add(parking.value, input.photos);
    // 409 depuis la correction de l'API ; la 404 des versions précédentes reste comprise
    // le temps que tous les environnements soient à jour.
    if (!result.ok && (result.error instanceof ConflictError || result.error instanceof NotFoundError)) {
      return err(new DuplicateParkingError());
    }
    return result;
  }
}
