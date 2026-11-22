import {
  EmailAlreadyUsedError,
  UsernameAlreadyTakenError,
  WrongCredentialsError,
} from '@application/auth/auth.errors';
import { NetworkError } from '@application/errors/gateway.errors';
import {
  InvalidCredentialsInputError,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  type CredentialField,
  type CredentialProblem,
} from '@domain/auth/credentials';

export type FieldErrors = Partial<Record<CredentialField, string>>;

const FIELD_MESSAGES: Record<CredentialField, Partial<Record<CredentialProblem, string>>> = {
  email: {
    required: 'Saisissez votre email.',
    'invalid-email': 'Cet email n’est pas valide.',
  },
  username: {
    required: 'Choisissez un nom d’utilisateur.',
    'too-short': `Au moins ${USERNAME_MIN_LENGTH} caractères.`,
    'too-long': `${USERNAME_MAX_LENGTH} caractères maximum.`,
  },
  password: {
    required: 'Saisissez votre mot de passe.',
    'too-short': `Au moins ${PASSWORD_MIN_LENGTH} caractères.`,
    'too-long': `${PASSWORD_MAX_LENGTH} caractères maximum.`,
    weak: 'Il manque une majuscule, une minuscule, un chiffre ou un caractère spécial.',
  },
};

/** Erreurs rattachées à un champ précis. */
export function fieldErrors(error: Error | null): FieldErrors {
  if (error instanceof InvalidCredentialsInputError) {
    return Object.fromEntries(
      Object.entries(error.problems).map(([field, problem]) => [
        field,
        FIELD_MESSAGES[field as CredentialField][problem] ?? 'Valeur invalide.',
      ]),
    );
  }
  if (error instanceof EmailAlreadyUsedError) {
    return { email: 'Un compte existe déjà avec cet email. Connectez-vous plutôt.' };
  }
  if (error instanceof UsernameAlreadyTakenError) {
    return { username: 'Ce nom d’utilisateur est déjà pris. Choisissez-en un autre.' };
  }
  return {};
}

/** Erreur générale du formulaire (affichée au-dessus du bouton), ou `null` si elle concerne un champ. */
export function formError(error: Error | null): string | null {
  if (!error) return null;
  if (
    error instanceof InvalidCredentialsInputError ||
    error instanceof EmailAlreadyUsedError ||
    error instanceof UsernameAlreadyTakenError
  ) {
    return null;
  }
  if (error instanceof WrongCredentialsError) return 'Email ou mot de passe incorrect.';
  if (error instanceof NetworkError) {
    return error.reason === 'offline'
      ? 'Vous êtes hors ligne. Reconnectez-vous à Internet puis réessayez.'
      : 'Le serveur ne répond pas. Réessayez dans un instant.';
  }
  return 'Une erreur est survenue. Réessayez dans un instant.';
}
