import { DomainError } from '../shared/domain-error';
import { err, ok, type Result } from '../shared/result';

/** Règles d'inscription de l'API (`RegisterInputDTO`) : les vérifier ici évite un aller-retour pour rien. */
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 50;
export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_LENGTH = 20;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type CredentialField = 'email' | 'username' | 'password';
export type CredentialProblem = 'required' | 'invalid-email' | 'too-short' | 'too-long' | 'weak';
export type CredentialProblems = Partial<Record<CredentialField, CredentialProblem>>;

/** Un ou plusieurs champs du formulaire sont invalides ; `problems` dit lesquels et pourquoi. */
export class InvalidCredentialsInputError extends DomainError {
  readonly kind = 'InvalidCredentialsInput';

  constructor(readonly problems: CredentialProblems) {
    super(`Champs invalides : ${Object.keys(problems).join(', ')}.`);
  }
}

/** Les critères d'un mot de passe d'inscription, affichés en liste au fil de la saisie. */
export interface PasswordCheck {
  readonly length: boolean;
  readonly lowercase: boolean;
  readonly uppercase: boolean;
  readonly digit: boolean;
  readonly special: boolean;
}

export class PasswordPolicy {
  static check(password: string): PasswordCheck {
    return {
      length: password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      digit: /\d/.test(password),
      special: /[\W_]/.test(password),
    };
  }

  static problem(password: string): CredentialProblem | null {
    if (password.length === 0) return 'required';
    if (password.length < PASSWORD_MIN_LENGTH) return 'too-short';
    if (password.length > PASSWORD_MAX_LENGTH) return 'too-long';
    const check = PasswordPolicy.check(password);
    return check.lowercase && check.uppercase && check.digit && check.special ? null : 'weak';
  }
}

const emailProblem = (email: string): CredentialProblem | null => {
  if (email.length === 0) return 'required';
  return EMAIL_PATTERN.test(email) ? null : 'invalid-email';
};

const usernameProblem = (username: string): CredentialProblem | null => {
  if (username.length === 0) return 'required';
  if (username.length < USERNAME_MIN_LENGTH) return 'too-short';
  if (username.length > USERNAME_MAX_LENGTH) return 'too-long';
  return null;
};

const collect = (entries: [CredentialField, CredentialProblem | null][]): CredentialProblems =>
  Object.fromEntries(entries.filter(([, problem]) => problem !== null));

/** Email et mot de passe de connexion. Le mot de passe n'est pas jugé : seul le serveur sait s'il est bon. */
export class LoginCredentials {
  private constructor(
    readonly email: string,
    readonly password: string,
  ) {}

  static create(input: {
    email: string;
    password: string;
  }): Result<LoginCredentials, InvalidCredentialsInputError> {
    const email = input.email.trim();
    const problems = collect([
      ['email', emailProblem(email)],
      ['password', input.password.length === 0 ? 'required' : null],
    ]);
    return Object.keys(problems).length > 0
      ? err(new InvalidCredentialsInputError(problems))
      : ok(new LoginCredentials(email, input.password));
  }
}

/** Création de compte : mêmes règles que l'API. */
export class Registration {
  private constructor(
    readonly email: string,
    readonly username: string,
    readonly password: string,
  ) {}

  static create(input: {
    email: string;
    username: string;
    password: string;
  }): Result<Registration, InvalidCredentialsInputError> {
    const email = input.email.trim();
    const username = input.username.trim();
    const problems = collect([
      ['email', emailProblem(email)],
      ['username', usernameProblem(username)],
      ['password', PasswordPolicy.problem(input.password)],
    ]);
    return Object.keys(problems).length > 0
      ? err(new InvalidCredentialsInputError(problems))
      : ok(new Registration(email, username, input.password));
  }
}
