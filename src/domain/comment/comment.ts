import { Author, type AuthorSnapshot } from '../user/author';

export interface CommentSnapshot {
  readonly id: string;
  readonly content: string;
  readonly author: AuthorSnapshot;
  readonly createdAt: string;
}

export class Comment {
  private constructor(
    readonly id: string,
    readonly content: string,
    readonly author: Author,
    readonly createdAt: Date,
  ) {}

  static create(props: { id: string; content: string; author: Author; createdAt: Date }): Comment {
    return new Comment(props.id, props.content, props.author, props.createdAt);
  }

  static fromSnapshot(snapshot: CommentSnapshot): Comment {
    return new Comment(
      snapshot.id,
      snapshot.content,
      Author.fromSnapshot(snapshot.author),
      new Date(snapshot.createdAt),
    );
  }

  toSnapshot(): CommentSnapshot {
    return {
      id: this.id,
      content: this.content,
      author: this.author.toSnapshot(),
      createdAt: this.createdAt.toISOString(),
    };
  }
}

/** Une page de commentaires, du plus récent au plus ancien. */
export interface CommentPage {
  readonly items: readonly Comment[];
  readonly nextCursor: string | null;
}
