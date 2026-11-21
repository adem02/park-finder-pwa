export interface CurrentUserSnapshot {
  readonly id: string;
  readonly username: string;
  readonly email: string | null;
  readonly photoUrl: string | null;
}

/** L'utilisateur connecté. */
export class CurrentUser {
  private constructor(private readonly snapshot: CurrentUserSnapshot) {}

  static fromSnapshot(snapshot: CurrentUserSnapshot): CurrentUser {
    return new CurrentUser(snapshot);
  }

  get id(): string {
    return this.snapshot.id;
  }

  get username(): string {
    return this.snapshot.username;
  }

  get email(): string | null {
    return this.snapshot.email;
  }

  get photoUrl(): string | null {
    return this.snapshot.photoUrl;
  }

  /** Initiale pour l'avatar par défaut. */
  get initial(): string {
    return this.snapshot.username.trim().charAt(0).toUpperCase() || '?';
  }

  toSnapshot(): CurrentUserSnapshot {
    return { ...this.snapshot };
  }
}
