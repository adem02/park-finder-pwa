import { DomainError } from '../shared/domain-error';
import { err, ok, type Result } from '../shared/result';

/** Un commentaire fait de 1 à 500 caractères (docs/decisions.md). */
export const COMMENT_MAX_LENGTH = 500;

export class InvalidCommentContentError extends DomainError {
  readonly kind = 'InvalidCommentContent';

  constructor(readonly reason: 'empty' | 'too-long') {
    super(
      reason === 'empty'
        ? 'Le commentaire est vide.'
        : `Le commentaire dépasse ${COMMENT_MAX_LENGTH} caractères.`,
    );
  }
}

export class CommentContent {
  private constructor(readonly value: string) {}

  static create(raw: string): Result<CommentContent, InvalidCommentContentError> {
    const value = raw.trim();
    if (value.length === 0) return err(new InvalidCommentContentError('empty'));
    if (value.length > COMMENT_MAX_LENGTH) return err(new InvalidCommentContentError('too-long'));
    return ok(new CommentContent(value));
  }
}
