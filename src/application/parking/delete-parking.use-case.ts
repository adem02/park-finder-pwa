import type { ParkingId } from '@domain/parking/parking-summary';
import { err, type Result } from '@domain/shared/result';
import { API_ERROR_CODES } from '../auth/auth.errors';
import { ConflictError, type GatewayError } from '../errors/gateway.errors';
import type { ParkingGateway } from '../ports/parking.gateway';

/** D'autres ont voté, commenté ou signalé : le parking appartient désormais à la communauté. */
export class ParkingHasContributionsError extends Error {
  readonly kind = 'ParkingHasContributions';

  constructor() {
    super('D’autres utilisateurs ont contribué à ce parking.');
    this.name = 'ParkingHasContributionsError';
  }
}

export type DeleteParkingError = ParkingHasContributionsError | GatewayError;

/**
 * L'auteur retire son parking (erreur de saisie, doublon), tant que personne d'autre n'y a
 * contribué. L'API reprend les points gagnés pour l'ajout.
 */
export class DeleteParking {
  constructor(private readonly parkings: ParkingGateway) {}

  async execute(id: ParkingId): Promise<Result<void, DeleteParkingError>> {
    const result = await this.parkings.delete(id);
    if (
      !result.ok &&
      result.error instanceof ConflictError &&
      result.error.code === API_ERROR_CODES.parkingHasContributions
    ) {
      return err(new ParkingHasContributionsError());
    }
    return result;
  }
}
