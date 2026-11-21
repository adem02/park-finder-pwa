/** Email inconnu ou mot de passe faux : le serveur ne dit volontairement pas lequel. */
export class WrongCredentialsError extends Error {
  readonly kind = 'WrongCredentials';

  constructor() {
    super('Email ou mot de passe incorrect.');
    this.name = 'WrongCredentialsError';
  }
}

export class EmailAlreadyUsedError extends Error {
  readonly kind = 'EmailAlreadyUsed';

  constructor() {
    super('Un compte existe déjà avec cet email.');
    this.name = 'EmailAlreadyUsedError';
  }
}
