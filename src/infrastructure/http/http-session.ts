import { UnauthorizedError } from '@application/errors/gateway.errors';
import { AccessTokenStore } from './access-token-store';
import { FetchHttpClient, type FetchHttpClientOptions } from './fetch-http-client';
import { SessionExpiryNotifier } from './session-expiry-notifier';
import { TokenRefresher, type LockRunner } from './token-refresher';

/**
 * Assemble le transport authentifié : chaque requête porte l'access token ; sur un 401,
 * le token est renouvelé une fois puis la requête rejouée ; si le renouvellement est refusé,
 * la session est terminée et l'UI prévenue.
 */
export class HttpSession {
  readonly tokens = new AccessTokenStore();
  readonly expiry = new SessionExpiryNotifier();
  readonly http: FetchHttpClient;
  readonly refresher: TokenRefresher;

  constructor(
    options: Omit<FetchHttpClientOptions, 'getAccessToken' | 'onUnauthorized'>,
    locks?: LockRunner,
  ) {
    this.http = new FetchHttpClient({
      ...options,
      getAccessToken: () => this.tokens.get(),
      onUnauthorized: () => this.renewAfterUnauthorized(),
    });
    this.refresher = new TokenRefresher(this.http, this.tokens, locks);
  }

  private async renewAfterUnauthorized(): Promise<boolean> {
    const renewed = await this.refresher.refresh();
    if (!renewed.ok && renewed.error instanceof UnauthorizedError) this.expiry.notify();
    return renewed.ok;
  }
}
