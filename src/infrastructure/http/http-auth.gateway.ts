import {
  InvalidResponseError,
  NetworkError,
  ServerError,
  type GatewayError,
} from '@application/errors/gateway.errors';
import type { AuthGateway } from '@application/ports/auth.gateway';
import type { LoginCredentials, Registration } from '@domain/auth/credentials';
import { err, ok, type Result } from '@domain/shared/result';
import type { CurrentUser } from '@domain/user/current-user';
import { authResponseDtoSchema, meResponseDtoSchema } from './dto/auth.dto';
import { Endpoints } from './endpoints';
import type { HttpSession } from './http-session';
import { SessionUserMapper } from './mappers/session-user.mapper';

const STARTUP_TIMEOUT_MS = 30_000;
const STARTUP_RETRY_DELAY_MS = 1_000;

/** L'API ne répond pas encore : délai dépassé, injoignable (en ligne), ou 502/503/504 du proxy. */
const isWakingUp = (error: GatewayError): boolean =>
  (error instanceof NetworkError && error.reason !== 'offline') ||
  (error instanceof ServerError && [502, 503, 504].includes(error.status));

export class HttpAuthGateway implements AuthGateway {
  constructor(
    private readonly session: HttpSession,
    private readonly wait: (ms: number) => Promise<void> = (ms) =>
      new Promise((resolve) => setTimeout(resolve, ms)),
  ) {}

  login(credentials: LoginCredentials): Promise<Result<CurrentUser, GatewayError>> {
    return this.authenticate(Endpoints.auth.login, {
      email: credentials.email,
      password: credentials.password,
    });
  }

  register(registration: Registration): Promise<Result<CurrentUser, GatewayError>> {
    return this.authenticate(Endpoints.auth.register, {
      email: registration.email,
      username: registration.username,
      password: registration.password,
    });
  }

  /**
   * À l'ouverture de l'app, l'API peut sortir de veille (Scaleway l'éteint quand personne ne
   * s'en sert) : on lui laisse 30 s au lieu de 10, et on retente une fois si elle n'a pas
   * répondu ou répond « pas encore prête ». Un refus (401) n'est jamais retenté.
   */
  async resume(): Promise<Result<CurrentUser, GatewayError>> {
    let renewed = await this.session.refresher.refresh({ timeoutMs: STARTUP_TIMEOUT_MS });
    if (!renewed.ok && isWakingUp(renewed.error)) {
      await this.wait(STARTUP_RETRY_DELAY_MS);
      renewed = await this.session.refresher.refresh({ timeoutMs: STARTUP_TIMEOUT_MS });
    }
    if (!renewed.ok) return renewed;

    const response = await this.session.http.getJson(Endpoints.users.me);
    if (!response.ok) return response;

    const parsed = meResponseDtoSchema.safeParse(response.value);
    if (!parsed.success) return err(new InvalidResponseError(parsed.error.message));
    return ok(SessionUserMapper.toDomain(parsed.data.user));
  }

  async logout(): Promise<Result<void, GatewayError>> {
    try {
      const response = await this.session.http.postJson(Endpoints.auth.logout, undefined, {
        retryOnUnauthorized: false,
      });
      return response.ok ? ok(undefined) : response;
    } finally {
      this.session.tokens.clear();
    }
  }

  async deleteAccount(): Promise<Result<void, GatewayError>> {
    const response = await this.session.http.delete(Endpoints.users.me);
    if (!response.ok) return response;
    // Le serveur a révoqué les sessions et effacé le cookie : l'access token ne doit plus servir.
    this.session.tokens.clear();
    return ok(undefined);
  }

  private async authenticate(
    path: string,
    body: Record<string, string>,
  ): Promise<Result<CurrentUser, GatewayError>> {
    const response = await this.session.http.postJson(path, body, { retryOnUnauthorized: false });
    if (!response.ok) return response;

    const parsed = authResponseDtoSchema.safeParse(response.value);
    if (!parsed.success) return err(new InvalidResponseError(parsed.error.message));

    this.session.tokens.set(parsed.data.accessToken);
    return ok(SessionUserMapper.toDomain(parsed.data.user));
  }
}
