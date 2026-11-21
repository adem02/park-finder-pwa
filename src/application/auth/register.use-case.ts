import { Registration, type InvalidCredentialsInputError } from '@domain/auth/credentials';
import { err, type Result } from '@domain/shared/result';
import type { CurrentUser } from '@domain/user/current-user';
import { ConflictError, type GatewayError } from '../errors/gateway.errors';
import type { AuthGateway } from '../ports/auth.gateway';
import { EmailAlreadyUsedError } from './auth.errors';

export interface RegisterInput {
  readonly email: string;
  readonly username: string;
  readonly password: string;
}

export type RegisterError = InvalidCredentialsInputError | EmailAlreadyUsedError | GatewayError;

export class Register {
  constructor(private readonly auth: AuthGateway) {}

  async execute(input: RegisterInput): Promise<Result<CurrentUser, RegisterError>> {
    const registration = Registration.create(input);
    if (!registration.ok) return registration;

    const result = await this.auth.register(registration.value);
    if (!result.ok && result.error instanceof ConflictError) {
      return err(new EmailAlreadyUsedError());
    }
    return result;
  }
}
