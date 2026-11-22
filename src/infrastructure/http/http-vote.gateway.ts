import type { GatewayError } from '@application/errors/gateway.errors';
import type { VoteGateway } from '@application/ports/vote.gateway';
import type { ParkingId } from '@domain/parking/parking-summary';
import { ok, type Result } from '@domain/shared/result';
import type { VoteType } from '@domain/vote/parking-votes';
import { Endpoints } from './endpoints';
import type { FetchHttpClient } from './fetch-http-client';

export class HttpVoteGateway implements VoteGateway {
  constructor(private readonly http: FetchHttpClient) {}

  async vote(parkingId: ParkingId, type: VoteType): Promise<Result<void, GatewayError>> {
    // L'API attend le type en paramètre d'URL : POST /parkings/:id/vote?type=UPVOTE
    const response = await this.http.postJson(Endpoints.parkings.vote(parkingId), undefined, {
      query: { type },
    });
    return response.ok ? ok(undefined) : response;
  }

  async cancelVote(parkingId: ParkingId): Promise<Result<void, GatewayError>> {
    const response = await this.http.delete(Endpoints.parkings.vote(parkingId));
    return response.ok ? ok(undefined) : response;
  }
}
