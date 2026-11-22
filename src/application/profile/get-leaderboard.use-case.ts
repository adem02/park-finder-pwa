import { YearMonth, type InvalidMonthError, type Leaderboard } from '@domain/leaderboard/leaderboard';
import type { Result } from '@domain/shared/result';
import type { GatewayError } from '../errors/gateway.errors';
import type { Clock } from '../ports/clock.port';
import type { ProfileGateway } from '../ports/profile.gateway';

export class GetLeaderboard {
  constructor(
    private readonly profiles: ProfileGateway,
    private readonly clock: Clock,
  ) {}

  /** `month` au format AAAA-MM ; absent = mois en cours. */
  execute(
    month?: string,
    signal?: AbortSignal,
  ): Promise<Result<Leaderboard, InvalidMonthError | GatewayError>> {
    if (month === undefined) return this.profiles.getLeaderboard(YearMonth.of(this.clock.now()), signal);

    const parsed = YearMonth.parse(month);
    if (!parsed.ok) return Promise.resolve(parsed);
    return this.profiles.getLeaderboard(parsed.value, signal);
  }
}
