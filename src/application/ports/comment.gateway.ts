import type { CommentPage } from '@domain/comment/comment';
import type { CommentContent } from '@domain/comment/comment-content';
import type { ParkingId } from '@domain/parking/parking-summary';
import type { Result } from '@domain/shared/result';
import type { GatewayError } from '../errors/gateway.errors';

export interface CommentGateway {
  /** Commentaires du plus récent au plus ancien, page par page (curseur opaque). */
  list(
    parkingId: ParkingId,
    cursor: string | null,
    signal?: AbortSignal,
  ): Promise<Result<CommentPage, GatewayError>>;

  post(parkingId: ParkingId, content: CommentContent): Promise<Result<void, GatewayError>>;
}
