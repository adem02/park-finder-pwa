import type { CommentPage } from '@domain/comment/comment';
import type { ParkingId } from '@domain/parking/parking-summary';
import type { Result } from '@domain/shared/result';
import type { GatewayError } from '../errors/gateway.errors';
import type { CommentGateway } from '../ports/comment.gateway';

export class ListParkingComments {
  constructor(private readonly comments: CommentGateway) {}

  execute(
    input: { parkingId: ParkingId; cursor: string | null },
    signal?: AbortSignal,
  ): Promise<Result<CommentPage, GatewayError>> {
    return this.comments.list(input.parkingId, input.cursor, signal);
  }
}
