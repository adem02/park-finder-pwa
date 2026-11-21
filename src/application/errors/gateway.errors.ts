/** Erreurs qu'un gateway (accès aux données distantes) peut renvoyer, quel que soit le transport. */
export abstract class GatewayFailure extends Error {
  abstract readonly kind: string;

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class NetworkError extends GatewayFailure {
  readonly kind = 'Network';

  constructor(readonly reason: 'offline' | 'timeout' | 'unreachable') {
    super(`Réseau indisponible (${reason}).`);
  }
}

export class UnauthorizedError extends GatewayFailure {
  readonly kind = 'Unauthorized';

  constructor() {
    super('Session expirée ou absente.');
  }
}

export class NotFoundError extends GatewayFailure {
  readonly kind = 'NotFound';

  constructor() {
    super('Ressource introuvable.');
  }
}

export class ServerError extends GatewayFailure {
  readonly kind = 'Server';

  constructor(readonly status: number) {
    super(`Erreur serveur (${status}).`);
  }
}

export class InvalidResponseError extends GatewayFailure {
  readonly kind = 'InvalidResponse';

  constructor(readonly details: string) {
    super(`Réponse inattendue du serveur : ${details}`);
  }
}

export type GatewayError =
  | NetworkError
  | UnauthorizedError
  | NotFoundError
  | ServerError
  | InvalidResponseError;
