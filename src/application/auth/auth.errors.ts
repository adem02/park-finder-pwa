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

export class UsernameAlreadyTakenError extends Error {
  readonly kind = 'UsernameAlreadyTaken';

  constructor() {
    super('Ce nom d’utilisateur est déjà pris.');
    this.name = 'UsernameAlreadyTakenError';
  }
}

/** Codes d'erreur de park-finder-api (nom des exceptions métier, champ `error` des réponses 409). */
export const API_ERROR_CODES = {
  usernameTaken: 'UsernameAlreadyTakenException',
  emailTaken: 'EmailAlreadyInUseException',
  parkingExists: 'ParkingAlreadyExistsException',
  parkingHasContributions: 'ParkingHasContributionsException',
  parkingPhotosFull: 'ParkingPhotosFullException',
} as const;
