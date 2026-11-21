import { InvalidResponseError, type GatewayError } from '@application/errors/gateway.errors';
import type { AuthGateway } from '@application/ports/auth.gateway';
import type { LoginCredentials, Registration } from '@domain/auth/credentials';
import { err, ok, type Result } from '@domain/shared/result';
import type { CurrentUser } from '@domain/user/current-user';
import { authResponseDtoSchema, meResponseDtoSchema } from './dto/auth.dto';
import { Endpoints } from './endpoints';
import type { HttpSession } from './http-session';
import { SessionUserMapper } from './mappers/session-user.mapper';

export class HttpAuthGateway implements AuthGateway {
  constructor(private readonly session: HttpSession) {}

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

  async resume(): Promise<Result<CurrentUser, GatewayError>> {
    const renewed = await this.session.refresher.refresh();
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
