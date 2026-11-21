import { CommentContent, type InvalidCommentContentError } from '@domain/comment/comment-content';
import type { ParkingId } from '@domain/parking/parking-summary';
import type { Result } from '@domain/shared/result';
import type { GatewayError } from '../errors/gateway.errors';
import type { CommentGateway } from '../ports/comment.gateway';

export type PostCommentError = InvalidCommentContentError | GatewayError;

export class PostComment {
  constructor(private readonly comments: CommentGateway) {}

  async execute(input: {
    parkingId: ParkingId;
    content: string;
  }): Promise<Result<void, PostCommentError>> {
    const content = CommentContent.create(input.content);
    if (!content.ok) return content;

    return this.comments.post(input.parkingId, content.value);
  }
}
