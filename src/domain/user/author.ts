export interface AuthorSnapshot {
  readonly id: string;
  readonly username: string;
  readonly photoUrl: string | null;
}

/** Utilisateur affiché à côté d'un contenu (auteur d'un parking, d'un commentaire). */
export class Author {
  private constructor(
    readonly id: string,
    readonly username: string,
    readonly photoUrl: string | null,
  ) {}

  static fromSnapshot(snapshot: AuthorSnapshot): Author {
    return new Author(snapshot.id, snapshot.username, snapshot.photoUrl);
  }

  /** Initiale pour l'avatar par défaut. */
  get initial(): string {
    return this.username.trim().charAt(0).toUpperCase() || '?';
  }

  toSnapshot(): AuthorSnapshot {
    return { id: this.id, username: this.username, photoUrl: this.photoUrl };
  }
}
