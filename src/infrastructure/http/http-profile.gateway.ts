import { InvalidResponseError, type GatewayError } from '@application/errors/gateway.errors';
import type { ProfileGateway } from '@application/ports/profile.gateway';
import type { Leaderboard, YearMonth } from '@domain/leaderboard/leaderboard';
import { err, ok, type Result } from '@domain/shared/result';
import type { UserProfile } from '@domain/user/user-profile';
import { leaderboardDtoSchema, profileDtoSchema } from './dto/profile.dto';
import { Endpoints } from './endpoints';
import type { FetchHttpClient } from './fetch-http-client';
import { ProfileMapper } from './mappers/profile.mapper';

export class HttpProfileGateway implements ProfileGateway {
  constructor(private readonly http: FetchHttpClient) {}

  async getMyProfile(signal?: AbortSignal): Promise<Result<UserProfile, GatewayError>> {
    const response = await this.http.getJson(Endpoints.users.me, { signal });
    if (!response.ok) return response;

    const parsed = profileDtoSchema.safeParse(response.value);
    if (!parsed.success) return err(new InvalidResponseError(parsed.error.message));
    return ok(ProfileMapper.toDomain(parsed.data));
  }

  async getLeaderboard(month: YearMonth, signal?: AbortSignal): Promise<Result<Leaderboard, GatewayError>> {
    const response = await this.http.getJson(Endpoints.users.leaderboard, {
      query: { month: month.toString() },
      signal,
    });
    if (!response.ok) return response;

    const parsed = leaderboardDtoSchema.safeParse(response.value);
    if (!parsed.success) return err(new InvalidResponseError(parsed.error.message));
    return ok(ProfileMapper.leaderboardToDomain(parsed.data));
  }
}
