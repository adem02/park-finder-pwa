import { describe, expect, it } from 'vitest';
import { InvalidReportError, SpotCount } from '@domain/availability/spot-count';
import {
  COMMENT_MAX_LENGTH,
  CommentContent,
  InvalidCommentContentError,
} from '@domain/comment/comment-content';

describe('SpotCount', () => {
  it.each([0, 1, 30])('accepte %s place(s) sur 30', (spots) => {
    expect(SpotCount.create(spots, 30).ok).toBe(true);
  });

  it.each([-1, 31, 2.5, Number.NaN])('refuse %s sur 30', (spots) => {
    const result = SpotCount.create(spots, 30);

    expect(!result.ok && result.error).toBeInstanceOf(InvalidReportError);
  });

  it('sait dire si le parking est plein', () => {
    const full = SpotCount.create(0, 30);

    expect(full.ok && full.value.isFull()).toBe(true);
  });
});

describe('CommentContent', () => {
  it('retire les espaces autour du texte', () => {
    const content = CommentContent.create('  Accès facile  ');

    expect(content.ok && content.value.value).toBe('Accès facile');
  });

  it('refuse un commentaire vide ou fait d’espaces', () => {
    const content = CommentContent.create('   ');

    expect(!content.ok && content.error).toBeInstanceOf(InvalidCommentContentError);
    expect(!content.ok && content.error.reason).toBe('empty');
  });

  it(`accepte ${COMMENT_MAX_LENGTH} caractères, refuse au-delà`, () => {
    expect(CommentContent.create('a'.repeat(COMMENT_MAX_LENGTH)).ok).toBe(true);

    const tooLong = CommentContent.create('a'.repeat(COMMENT_MAX_LENGTH + 1));
    expect(!tooLong.ok && tooLong.error.reason).toBe('too-long');
  });
});
