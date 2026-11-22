import type { GatewayError } from '@application/errors/gateway.errors';
import type { Clock } from '@application/ports/clock.port';
import type { ProfileGateway } from '@application/ports/profile.gateway';
import { Leaderboard, YearMonth, type LeaderboardEntrySnapshot } from '@domain/leaderboard/leaderboard';
import { ok, type Result } from '@domain/shared/result';
import { UserProfile } from '@domain/user/user-profile';
import { DEMO_USER, type InMemoryParkingStore } from './in-memory-parking.store';

/** Mêmes barèmes que l'API (docs/decisions.md). */
const POINTS = { parkingAdded: 20, report: 5, vote: 1 } as const;
const POINTS_PER_LEVEL = 100;
const EXPLORER_THRESHOLD = 10;

/** Contributeurs fictifs du classement de démo. */
const DEMO_RIVALS = [
  { userId: 'demo-contributor-0', username: 'camille_r', monthlyPoints: 340 },
  { userId: 'demo-contributor-1', username: 'theo51', monthlyPoints: 260 },
  { userId: 'demo-contributor-2', username: 'ines.m', monthlyPoints: 180 },
  { userId: 'demo-contributor-3', username: 'lucas_reims', monthlyPoints: 95 },
] as const;

/** Profil de démo calculé à partir de ce que l'utilisateur fait dans l'app (ajouts, signalements, votes). */
export class InMemoryProfileGateway implements ProfileGateway {
  constructor(
    private readonly store: InMemoryParkingStore,
    private readonly clock: Clock,
    private readonly email: string | null = null,
  ) {}

  getMyProfile(): Promise<Result<UserProfile, GatewayError>> {
    const added = this.store.all().filter((record) => record.addedBy.id === DEMO_USER.id);
    const votesCount = this.store.all().filter((record) => record.userVote !== null).length;
    const reportsCount = this.store.reportsCount;
    const points = this.points();
    const level = Math.floor(points / POINTS_PER_LEVEL);
    const rank = this.rankOf(points);

    return Promise.resolve(
      ok(
        UserProfile.fromSnapshot({
          user: { ...DEMO_USER.toSnapshot(), email: this.email },
          stats: { parkingsAdded: added.length, reportsCount, votesCount },
          level: {
            points,
            level,
            nextLevelThreshold: (level + 1) * POINTS_PER_LEVEL,
            progressToNextLevel: points % POINTS_PER_LEVEL,
            pointsToNextLevel: (level + 1) * POINTS_PER_LEVEL - points,
          },
          badges:
            added.length >= EXPLORER_THRESHOLD
              ? [{ id: 'explorer', name: 'Explorer', description: '10 parkings ajoutés', iconUrl: '' }]
              : [],
          monthlyRank: rank,
          recentParkings: [...added]
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, 5)
            .map((record) => ({
              id: record.id,
              name: record.name,
              score: record.upvotes - record.downvotes,
              votesCount: record.upvotes + record.downvotes,
            })),
        }),
      ),
    );
  }

  getLeaderboard(month: YearMonth): Promise<Result<Leaderboard, GatewayError>> {
    const isCurrent = month.toString() === YearMonth.of(this.clock.now()).toString();
    const points = isCurrent ? this.points() : 0;
    const entries = this.ranked(isCurrent ? points : 0, isCurrent ? 1 : 0.8);

    return Promise.resolve(
      ok(
        Leaderboard.fromSnapshot({
          month: month.toString(),
          entries,
          userRank: isCurrent ? this.rankOf(points) : null,
        }),
      ),
    );
  }

  private points(): number {
    const all = this.store.all();
    const added = all.filter((record) => record.addedBy.id === DEMO_USER.id).length;
    const votes = all.filter((record) => record.userVote !== null).length;
    return added * POINTS.parkingAdded + this.store.reportsCount * POINTS.report + votes * POINTS.vote;
  }

  private ranked(userPoints: number, rivalsFactor: number): LeaderboardEntrySnapshot[] {
    const rivals = DEMO_RIVALS.map((rival) => ({
      ...rival,
      photoUrl: null,
      monthlyPoints: Math.round(rival.monthlyPoints * rivalsFactor),
    }));
    const people =
      userPoints > 0
        ? [...rivals, { userId: DEMO_USER.id, username: DEMO_USER.username, photoUrl: null, monthlyPoints: userPoints }]
        : rivals;
    return people
      .sort((a, b) => b.monthlyPoints - a.monthlyPoints)
      .map((person, index) => ({ ...person, rank: index + 1 }));
  }

  private rankOf(points: number) {
    if (points === 0) return null;
    const entries = this.ranked(points, 1);
    const rank = entries.find((entry) => entry.userId === DEMO_USER.id)?.rank ?? entries.length;
    return { rank, percentile: `${Math.round((rank / entries.length) * 100)}%`, monthlyPoints: points };
  }
}
