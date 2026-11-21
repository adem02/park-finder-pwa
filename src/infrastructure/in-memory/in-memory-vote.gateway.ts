import { ConflictError, NotFoundError, type GatewayError } from '@application/errors/gateway.errors';
import type { VoteGateway } from '@application/ports/vote.gateway';
import type { ParkingId } from '@domain/parking/parking-summary';
import { err, ok, type Result } from '@domain/shared/result';
import type { VoteType } from '@domain/vote/parking-votes';
import type { InMemoryParkingStore } from './in-memory-parking.store';

/** Reproduit l'API : voter deux fois pareil = 409, annuler sans vote = 404. */
export class InMemoryVoteGateway implements VoteGateway {
  constructor(private readonly store: InMemoryParkingStore) {}

  vote(parkingId: ParkingId, type: VoteType): Promise<Result<void, GatewayError>> {
    const record = this.store.find(parkingId);
    if (!record) return Promise.resolve(err(new NotFoundError()));
    if (record.userVote === type) return Promise.resolve(err(new ConflictError('vote déjà enregistré')));

    this.store.update(parkingId, {
      userVote: type,
      upvotes: record.upvotes - (record.userVote === 'UPVOTE' ? 1 : 0) + (type === 'UPVOTE' ? 1 : 0),
      downvotes:
        record.downvotes - (record.userVote === 'DOWNVOTE' ? 1 : 0) + (type === 'DOWNVOTE' ? 1 : 0),
    });
    return Promise.resolve(ok(undefined));
  }

  cancelVote(parkingId: ParkingId): Promise<Result<void, GatewayError>> {
    const record = this.store.find(parkingId);
    if (!record?.userVote) return Promise.resolve(err(new NotFoundError()));

    this.store.update(parkingId, {
      userVote: null,
      upvotes: record.upvotes - (record.userVote === 'UPVOTE' ? 1 : 0),
      downvotes: record.downvotes - (record.userVote === 'DOWNVOTE' ? 1 : 0),
    });
    return Promise.resolve(ok(undefined));
  }
}
