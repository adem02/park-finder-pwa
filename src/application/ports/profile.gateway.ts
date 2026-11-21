import type { Leaderboard, YearMonth } from '@domain/leaderboard/leaderboard';
import type { Result } from '@domain/shared/result';
import type { UserProfile } from '@domain/user/user-profile';
import type { GatewayError } from '../errors/gateway.errors';

export interface ProfileGateway {
  getMyProfile(signal?: AbortSignal): Promise<Result<UserProfile, GatewayError>>;
  getLeaderboard(month: YearMonth, signal?: AbortSignal): Promise<Result<Leaderboard, GatewayError>>;
}
