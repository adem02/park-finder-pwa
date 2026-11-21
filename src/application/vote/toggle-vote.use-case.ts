import type { ParkingDetails } from '@domain/parking/parking-details';
import { ok, type Result } from '@domain/shared/result';
import type { ParkingVotes, VoteType } from '@domain/vote/parking-votes';
import type { GatewayError } from '../errors/gateway.errors';
import type { VoteGateway } from '../ports/vote.gateway';

/**
 * Toucher 👍 ou 👎 : vote, change de vote ou annule selon le vote actuel.
 * `preview` donne le résultat attendu tout de suite (affichage optimiste).
 */
export class ToggleVote {
  constructor(private readonly votes: VoteGateway) {}

  preview(parking: ParkingDetails, type: VoteType): ParkingVotes {
    return parking.votes.toggle(type).votes;
  }

  async execute(input: {
    parking: ParkingDetails;
    type: VoteType;
  }): Promise<Result<ParkingVotes, GatewayError>> {
    const { votes, intent } = input.parking.votes.toggle(input.type);

    const sent =
      intent.kind === 'cancel'
        ? await this.votes.cancelVote(input.parking.id)
        : await this.votes.vote(input.parking.id, intent.type);
    if (!sent.ok) return sent;

    return ok(votes);
  }
}
