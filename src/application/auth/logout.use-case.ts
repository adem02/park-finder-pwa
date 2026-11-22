import type { AuthGateway } from '../ports/auth.gateway';

/**
 * Déconnexion. Elle aboutit toujours côté appareil : même si le serveur est injoignable,
 * l'adapter oublie l'access token. Le refresh token expirera de lui-même.
 */
export class Logout {
  constructor(private readonly auth: AuthGateway) {}

  async execute(): Promise<void> {
    await this.auth.logout();
  }
}
