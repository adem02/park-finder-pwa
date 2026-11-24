import { ConflictError, UnauthorizedError, type GatewayError } from '@application/errors/gateway.errors';
import { API_ERROR_CODES } from '@application/auth/auth.errors';
import type { AuthGateway } from '@application/ports/auth.gateway';
import type { SessionExpiryPort } from '@application/ports/session-expiry.port';
import type { LoginCredentials, Registration } from '@domain/auth/credentials';
import { err, ok, type Result } from '@domain/shared/result';
import { CurrentUser } from '@domain/user/current-user';

interface DemoAccount {
  readonly password: string;
  readonly user: CurrentUser;
}

/** Compte de la démo, affiché sur l'écran de connexion en mode démo. */
export const DEMO_ACCOUNT = { email: 'demo@parkfinder.app', password: 'Demo123!' } as const;

/**
 * Auth en mémoire : tests et mode démo. La démo démarre connectée (comme après un rechargement
 * avec un cookie valide) ; se déconnecter permet d'essayer les écrans de connexion et d'inscription.
 */
export class InMemoryAuthGateway implements AuthGateway {
  private readonly accounts = new Map<string, DemoAccount>();
  private current: CurrentUser | null;

  constructor(options: { signedIn?: boolean } = {}) {
    const demoUser = CurrentUser.fromSnapshot({
      id: 'demo-user',
      username: 'Vous',
      email: DEMO_ACCOUNT.email,
      photoUrl: null,
    });
    this.accounts.set(DEMO_ACCOUNT.email, { password: DEMO_ACCOUNT.password, user: demoUser });
    this.current = options.signedIn === false ? null : demoUser;
  }

  login(credentials: LoginCredentials): Promise<Result<CurrentUser, GatewayError>> {
    const account = this.accounts.get(credentials.email);
    if (!account || account.password !== credentials.password) {
      return Promise.resolve(err(new UnauthorizedError()));
    }
    this.current = account.user;
    return Promise.resolve(ok(account.user));
  }

  register(registration: Registration): Promise<Result<CurrentUser, GatewayError>> {
    if (this.accounts.has(registration.email)) {
      return Promise.resolve(err(new ConflictError('Email already in use', API_ERROR_CODES.emailTaken)));
    }
    const usernameTaken = [...this.accounts.values()].some(
      (account) => account.user.username.toLowerCase() === registration.username.toLowerCase(),
    );
    if (usernameTaken) {
      return Promise.resolve(err(new ConflictError('Username already taken', API_ERROR_CODES.usernameTaken)));
    }
    const user = CurrentUser.fromSnapshot({
      id: `user-${this.accounts.size + 1}`,
      username: registration.username,
      email: registration.email,
      photoUrl: null,
    });
    this.accounts.set(registration.email, { password: registration.password, user });
    this.current = user;
    return Promise.resolve(ok(user));
  }

  resume(): Promise<Result<CurrentUser, GatewayError>> {
    return Promise.resolve(this.current ? ok(this.current) : err(new UnauthorizedError()));
  }

  logout(): Promise<Result<void, GatewayError>> {
    this.current = null;
    return Promise.resolve(ok(undefined));
  }

  deleteAccount(): Promise<Result<void, GatewayError>> {
    if (!this.current) return Promise.resolve(err(new UnauthorizedError()));
    const email = this.current.email;
    if (email) this.accounts.delete(email);
    this.current = null;
    return Promise.resolve(ok(undefined));
  }
}

/** La démo n'expire jamais. */
export const neverExpires: SessionExpiryPort = { onExpired: () => () => undefined };
