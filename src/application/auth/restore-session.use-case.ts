import { ok, type Result } from '@domain/shared/result';
import type { CurrentUser } from '@domain/user/current-user';
import { UnauthorizedError, type GatewayError } from '../errors/gateway.errors';
import type { AuthGateway } from '../ports/auth.gateway';

/** Au démarrage : l'utilisateur connecté, ou `null` s'il n'a pas (ou plus) de session. */
export class RestoreSession {
  constructor(private readonly auth: AuthGateway) {}

  async execute(): Promise<Result<CurrentUser | null, GatewayError>> {
    const result = await this.auth.resume();
    if (!result.ok && result.error instanceof UnauthorizedError) return ok(null);
    return result;
  }
}
