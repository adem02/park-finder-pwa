import { InvalidResponseError, UnauthorizedError, type GatewayError } from '@application/errors/gateway.errors';
import { err, ok, type Result } from '@domain/shared/result';
import type { AccessTokenStore } from './access-token-store';
import { refreshResponseDtoSchema } from './dto/auth.dto';
import { Endpoints } from './endpoints';
import type { FetchHttpClient } from './fetch-http-client';

/** Exécute une tâche en exclusion mutuelle entre onglets. */
export type LockRunner = <T>(name: string, task: () => Promise<T>) => Promise<T>;

/**
 * Web Locks : deux onglets ne renouvellent jamais en même temps. Sinon ils enverraient le même
 * refresh token, que l'API ferait tourner une seule fois et refuserait à l'autre (session perdue).
 * Sans Web Locks (navigateur ancien), la tâche s'exécute directement.
 */
export const webLocks: LockRunner = (name, task) =>
  globalThis.navigator?.locks ? globalThis.navigator.locks.request(name, task) : task();

const LOCK_NAME = 'parkfinder-token-refresh';

/** Renouvelle l'access token avec le cookie de refresh. Un seul appel à la fois, même si dix requêtes échouent. */
export class TokenRefresher {
  private inFlight: Promise<Result<string, GatewayError>> | null = null;

  constructor(
    private readonly http: FetchHttpClient,
    private readonly tokens: AccessTokenStore,
    private readonly locks: LockRunner = webLocks,
  ) {}

  refresh(): Promise<Result<string, GatewayError>> {
    this.inFlight ??= this.locks(LOCK_NAME, () => this.callRefresh()).finally(() => {
      this.inFlight = null;
    });
    return this.inFlight;
  }

  private async callRefresh(): Promise<Result<string, GatewayError>> {
    const response = await this.http.postJson(Endpoints.auth.refresh, undefined, {
      retryOnUnauthorized: false,
    });
    if (!response.ok) {
      if (response.error instanceof UnauthorizedError) this.tokens.clear();
      return response;
    }

    const parsed = refreshResponseDtoSchema.safeParse(response.value);
    if (!parsed.success) return err(new InvalidResponseError(parsed.error.message));

    this.tokens.set(parsed.data.accessToken);
    return ok(parsed.data.accessToken);
  }
}
