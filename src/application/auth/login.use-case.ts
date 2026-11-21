import {
  LoginCredentials,
  type InvalidCredentialsInputError,
} from '@domain/auth/credentials';
import { err, type Result } from '@domain/shared/result';
import type { CurrentUser } from '@domain/user/current-user';
import { UnauthorizedError, type GatewayError } from '../errors/gateway.errors';
import type { AuthGateway } from '../ports/auth.gateway';
import { WrongCredentialsError } from './auth.errors';

export interface LoginInput {
  readonly email: string;
  readonly password: string;
}

export type LoginError = InvalidCredentialsInputError | WrongCredentialsError | GatewayError;

export class Login {
  constructor(private readonly auth: AuthGateway) {}

  async execute(input: LoginInput): Promise<Result<CurrentUser, LoginError>> {
    const credentials = LoginCredentials.create(input);
    if (!credentials.ok) return credentials;

    const result = await this.auth.login(credentials.value);
    // Sur /auth/login, un 401 veut dire « identifiants refusés », pas « session expirée ».
    if (!result.ok && result.error instanceof UnauthorizedError) {
      return err(new WrongCredentialsError());
    }
    return result;
  }
}
