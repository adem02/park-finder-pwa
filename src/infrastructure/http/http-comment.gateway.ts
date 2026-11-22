import { InvalidResponseError, type GatewayError } from '@application/errors/gateway.errors';
import type { CommentGateway } from '@application/ports/comment.gateway';
import type { CommentPage } from '@domain/comment/comment';
import type { CommentContent } from '@domain/comment/comment-content';
import type { ParkingId } from '@domain/parking/parking-summary';
import { err, ok, type Result } from '@domain/shared/result';
import { listCommentsResponseDtoSchema } from './dto/list-comments.dto';
import { Endpoints } from './endpoints';
import type { FetchHttpClient } from './fetch-http-client';
import { SharedMapper } from './mappers/shared.mapper';

/** 20 commentaires par page, la valeur par défaut de l'API. */
const PAGE_SIZE = 20;

export class HttpCommentGateway implements CommentGateway {
  constructor(private readonly http: FetchHttpClient) {}

  async list(
    parkingId: ParkingId,
    cursor: string | null,
    signal?: AbortSignal,
  ): Promise<Result<CommentPage, GatewayError>> {
    const response = await this.http.getJson(Endpoints.parkings.comments(parkingId), {
      query: { limit: PAGE_SIZE, cursor: cursor ?? undefined },
      signal,
    });
    if (!response.ok) return response;

    const parsed = listCommentsResponseDtoSchema.safeParse(response.value);
    if (!parsed.success) return err(new InvalidResponseError(parsed.error.message));

    return ok({
      items: parsed.data.items.map((comment) => SharedMapper.toComment(comment)),
      nextCursor: parsed.data.nextCursor,
    });
  }

  async post(parkingId: ParkingId, content: CommentContent): Promise<Result<void, GatewayError>> {
    const response = await this.http.postJson(Endpoints.parkings.comments(parkingId), {
      content: content.value,
    });
    return response.ok ? ok(undefined) : response;
  }
}
