import type { GatewayError } from '../errors/gateway.errors';
import type { AuthGateway } from '../ports/auth.gateway';
import type { Result } from '@domain/shared/result';

/**
 * Suppression du compte (droit à l'effacement). Le serveur anonymise le compte : données
 * personnelles, commentaires et points effacés, parkings conservés au nom de PlaceGratos.
 * En cas d'échec, la session reste ouverte et l'utilisateur peut réessayer.
 */
export class DeleteAccount {
  constructor(private readonly auth: AuthGateway) {}

  execute(): Promise<Result<void, GatewayError>> {
    return this.auth.deleteAccount();
  }
}
