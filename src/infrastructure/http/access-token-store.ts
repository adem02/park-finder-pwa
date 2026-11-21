/**
 * L'access token vit **en mémoire uniquement** : jamais dans localStorage, où un script injecté (XSS)
 * pourrait le lire. Après un rechargement, il est redemandé avec le refresh token (cookie httpOnly).
 */
export class AccessTokenStore {
  private token: string | null = null;

  get(): string | null {
    return this.token;
  }

  set(token: string): void {
    this.token = token;
  }

  clear(): void {
    this.token = null;
  }
}
