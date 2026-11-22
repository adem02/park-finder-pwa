import type { ParkingId } from '@domain/parking/parking-summary';
import type { Result } from '@domain/shared/result';
import type { VoteType } from '@domain/vote/parking-votes';
import type { GatewayError } from '../errors/gateway.errors';

export interface VoteGateway {
  /** Vote, ou change de vote s'il en existe déjà un de l'autre type. */
  vote(parkingId: ParkingId, type: VoteType): Promise<Result<void, GatewayError>>;

  cancelVote(parkingId: ParkingId): Promise<Result<void, GatewayError>>;
}
