import type { Result } from '@domain/shared/result';
import type { UserProfile } from '@domain/user/user-profile';
import type { GatewayError } from '../errors/gateway.errors';
import type { ProfileGateway } from '../ports/profile.gateway';

export class GetMyProfile {
  constructor(private readonly profiles: ProfileGateway) {}

  execute(signal?: AbortSignal): Promise<Result<UserProfile, GatewayError>> {
    return this.profiles.getMyProfile(signal);
  }
}
