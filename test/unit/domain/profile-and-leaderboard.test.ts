import { describe, expect, it } from 'vitest';
import { InvalidMonthError, YearMonth } from '@domain/leaderboard/leaderboard';
import { UserProfile, type UserProfileSnapshot } from '@domain/user/user-profile';

const profile = (overrides: Partial<UserProfileSnapshot> = {}) =>
  UserProfile.fromSnapshot({
    user: { id: 'u1', username: 'camille', email: null, photoUrl: null },
    stats: { parkingsAdded: 0, reportsCount: 0, votesCount: 0 },
    level: { points: 240, level: 2, nextLevelThreshold: 300, progressToNextLevel: 40, pointsToNextLevel: 60 },
    badges: [],
    monthlyRank: null,
    recentParkings: [],
    ...overrides,
  });

describe('UserProfile', () => {
  it('calcule l’avancement dans le niveau en cours', () => {
    expect(profile().levelProgress).toBeCloseTo(0.4);
  });

  it('distingue un nouveau venu d’un contributeur', () => {
    expect(profile().hasContributed()).toBe(false);
    expect(profile({ stats: { parkingsAdded: 0, reportsCount: 1, votesCount: 0 } }).hasContributed()).toBe(true);
  });
});

describe('YearMonth', () => {
  it('lit et écrit le format AAAA-MM de l’API', () => {
    const month = YearMonth.parse('2026-01');

    expect(month.ok && month.value.toString()).toBe('2026-01');
    expect(month.ok && month.value.previous().toString()).toBe('2025-12');
    expect(month.ok && month.value.next().toString()).toBe('2026-02');
  });

  it('refuse un mois invalide', () => {
    const month = YearMonth.parse('2026-13');

    expect(!month.ok && month.error).toBeInstanceOf(InvalidMonthError);
  });

  it('compare deux mois', () => {
    expect(YearMonth.of(new Date(2026, 9, 5)).isBefore(YearMonth.of(new Date(2026, 10, 1)))).toBe(true);
  });
});
