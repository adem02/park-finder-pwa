import { describe, expect, it, vi } from 'vitest';
import { YearMonth } from '@domain/leaderboard/leaderboard';
import { FetchHttpClient } from '@infrastructure/http/fetch-http-client';
import { HttpProfileGateway } from '@infrastructure/http/http-profile.gateway';
import { DEMO_USER, InMemoryParkingStore } from '@infrastructure/in-memory/in-memory-parking.store';
import { InMemoryProfileGateway } from '@infrastructure/in-memory/in-memory-profile.gateway';
import { FixedClock } from '@infrastructure/time/system-clock';
import { NOW, aRecord } from '../../support/parking.builder';

const BASE = 'https://api.parkfinder.test';
const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });
const gatewayWith = (fetchFn: typeof fetch) =>
  new HttpProfileGateway(new FetchHttpClient({ baseUrl: BASE, fetchFn, isOnline: () => true }));

/** Réponse au format exact de GetUserProfileOutputDTO. */
const apiProfile = {
  user: { id: 'u1', username: 'camille', email: 'camille@parkfinder.app' },
  stats: {
    parkingsAdded: 3,
    reportsCount: 7,
    votesCount: 12,
    points: 207,
    level: 2,
    nextLevelThreshold: 300,
    progressToNextLevel: 7,
    pointsToNextLevel: 93,
  },
  badges: [{ id: 'b1', name: 'Explorer', description: '10 parkings', iconUrl: 'https://cdn/explorer.png' }],
  rank: { rank: 4, percentile: '10%', monthlyPoints: 120 },
  recentParkings: [{ id: 'p1', name: 'Parking Erlon', score: 9, votesCount: 11 }],
};

describe('HttpProfileGateway', () => {
  it('convertit GET /users/me en profil', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(json(apiProfile));

    const result = await gatewayWith(fetchFn).getMyProfile();

    expect(fetchFn.mock.calls[0]?.[0]).toBe(`${BASE}/users/me`);
    expect(result.ok && result.value.level).toMatchObject({ level: 2, pointsToNextLevel: 93 });
    expect(result.ok && result.value.monthlyRank?.rank).toBe(4);
    expect(result.ok && result.value.user.photoUrl).toBeNull();
  });

  it('demande le classement du mois voulu', async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValue(json({ month: '2026-10', entries: [], userRank: null }));
    const month = YearMonth.parse('2026-10');
    if (!month.ok) throw month.error;

    const result = await gatewayWith(fetchFn).getLeaderboard(month.value);

    expect(fetchFn.mock.calls[0]?.[0]).toBe(`${BASE}/users/leaderboard?month=2026-10`);
    expect(result.ok && result.value.entries).toEqual([]);
  });
});

describe('InMemoryProfileGateway (démo)', () => {
  it('compte les points avec le barème de l’API', async () => {
    const store = new InMemoryParkingStore([
      aRecord({ id: 'mine', addedBy: DEMO_USER, upvotes: 4, downvotes: 1 }),
      aRecord({ id: 'voted', userVote: 'UPVOTE' }),
    ]);
    store.recordReport();
    const gateway = new InMemoryProfileGateway(store, new FixedClock(NOW));

    const profile = await gateway.getMyProfile();

    // 1 parking (20) + 1 signalement (5) + 1 vote (1)
    expect(profile.ok && profile.value.level.points).toBe(26);
    expect(profile.ok && profile.value.stats).toEqual({ parkingsAdded: 1, reportsCount: 1, votesCount: 1 });
    expect(profile.ok && profile.value.recentParkings).toEqual([
      { id: 'mine', name: 'Parking Erlon', score: 3, votesCount: 5 },
    ]);
  });
});
