import type { LoginCredentials, Registration } from '@domain/auth/credentials';
import type { Result } from '@domain/shared/result';
import type { CurrentUser } from '@domain/user/current-user';
import type { GatewayError } from '../errors/gateway.errors';

/**
 * Session de l'utilisateur. Les jetons restent un détail du transport :
 * l'adapter HTTP garde l'access token en mémoire et le refresh token vit dans un cookie httpOnly.
 */
export interface AuthGateway {
  login(credentials: LoginCredentials): Promise<Result<CurrentUser, GatewayError>>;
  register(registration: Registration): Promise<Result<CurrentUser, GatewayError>>;
  /** Reprend la session existante (après un rechargement). `UnauthorizedError` s'il n'y en a pas. */
  resume(): Promise<Result<CurrentUser, GatewayError>>;
  logout(): Promise<Result<void, GatewayError>>;
  /** Supprime le compte connecté (anonymisé côté serveur) et termine la session. */
  deleteAccount(): Promise<Result<void, GatewayError>>;
}
