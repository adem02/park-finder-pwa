import { NotFoundError, type GatewayError } from '@application/errors/gateway.errors';
import type { Clock } from '@application/ports/clock.port';
import type { CommentGateway } from '@application/ports/comment.gateway';
import { Comment, type CommentPage } from '@domain/comment/comment';
import type { CommentContent } from '@domain/comment/comment-content';
import type { ParkingId } from '@domain/parking/parking-summary';
import { err, ok, type Result } from '@domain/shared/result';
import type { Author } from '@domain/user/author';
import { DEMO_USER, type InMemoryParkingStore } from './in-memory-parking.store';

/** Pagination par décalage, encodé dans un curseur opaque comme côté API. */
export class InMemoryCommentGateway implements CommentGateway {
  private sequence = 0;

  constructor(
    private readonly store: InMemoryParkingStore,
    private readonly clock: Clock,
    private readonly author: Author = DEMO_USER,
    private readonly pageSize = 20,
  ) {}

  list(parkingId: ParkingId, cursor: string | null): Promise<Result<CommentPage, GatewayError>> {
    const record = this.store.find(parkingId);
    if (!record) return Promise.resolve(err(new NotFoundError()));

    const start = cursor === null ? 0 : Number(cursor);
    const end = start + this.pageSize;
    return Promise.resolve(
      ok({
        items: record.comments.slice(start, end),
        nextCursor: end < record.comments.length ? String(end) : null,
      }),
    );
  }

  post(parkingId: ParkingId, content: CommentContent): Promise<Result<void, GatewayError>> {
    const record = this.store.find(parkingId);
    if (!record) return Promise.resolve(err(new NotFoundError()));

    this.sequence += 1;
    const comment = Comment.create({
      id: `demo-comment-${this.sequence}`,
      content: content.value,
      author: this.author,
      createdAt: this.clock.now(),
    });
    this.store.update(parkingId, { comments: [comment, ...record.comments] });
    return Promise.resolve(ok(undefined));
  }
}
