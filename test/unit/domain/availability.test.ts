import { describe, expect, it } from 'vitest';
import { Availability } from '@domain/availability/availability';
import { NOW, minutesAgo } from '../../support/parking.builder';

const secondsAgo = (seconds: number): Date => new Date(NOW.getTime() - seconds * 1000);

describe('Availability', () => {
  describe('freshness', () => {
    it('vaut « none » sans signalement', () => {
      expect(Availability.none().freshness(NOW)).toBe('none');
    });

    it.each([
      [0, 'recent'],
      [9 * 60 + 59, 'recent'],
      [10 * 60, 'stale'],
      [14 * 60 + 59, 'stale'],
      [15 * 60, 'expired'],
      [60 * 60, 'expired'],
    ])('un signalement vieux de %s s est « %s »', (seconds, expected) => {
      expect(Availability.reported(5, secondsAgo(seconds)).freshness(NOW)).toBe(expected);
    });
  });

  describe('spotsAt', () => {
    it('renvoie les places tant que le signalement n’a pas expiré', () => {
      expect(Availability.reported(7, minutesAgo(12)).spotsAt(NOW)).toBe(7);
    });

    it('renvoie null après expiration', () => {
      expect(Availability.reported(7, minutesAgo(15)).spotsAt(NOW)).toBeNull();
    });
  });

  describe('level', () => {
    it.each([
      [null, 'unknown'],
      [0, 'full'],
      [9, 'low'],
      [10, 'ok'],
      [30, 'ok'],
    ])('avec %s places sur 30 : « %s »', (spots, expected) => {
      const availability =
        spots === null ? Availability.none() : Availability.reported(spots, minutesAgo(1));

      expect(availability.level(30, NOW)).toBe(expected);
    });

    it('repasse à « unknown » quand le signalement expire', () => {
      expect(Availability.reported(0, minutesAgo(20)).level(30, NOW)).toBe('unknown');
    });
  });

  it('se sérialise et se réhydrate à l’identique', () => {
    const availability = Availability.reported(4, minutesAgo(3));

    const restored = Availability.fromSnapshot(availability.toSnapshot());

    expect(restored.spotsAt(NOW)).toBe(4);
    expect(restored.reportedAt?.getTime()).toBe(minutesAgo(3).getTime());
  });
});
