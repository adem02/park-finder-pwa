import { describe, expect, it } from 'vitest';
import { Availability } from '@domain/availability/availability';
import { ParkingSummary } from '@domain/parking/parking-summary';
import { ParkingScore } from '@domain/vote/parking-score';
import { NOW, aParking, minutesAgo } from '../../support/parking.builder';

describe('ParkingSummary', () => {
  describe('pinState', () => {
    it('est vert (« recent ») avec des places signalées il y a moins de 10 min', () => {
      const parking = aParking({ availability: Availability.reported(8, minutesAgo(3)) });

      expect(parking.pinState(NOW)).toBe('recent');
    });

    it('est orange (« stale ») entre 10 et 15 min', () => {
      const parking = aParking({ availability: Availability.reported(8, minutesAgo(12)) });

      expect(parking.pinState(NOW)).toBe('stale');
    });

    it('est rouge (« full ») quand il est signalé plein, même ancien', () => {
      expect(aParking({ availability: Availability.reported(0, minutesAgo(2)) }).pinState(NOW)).toBe('full');
      expect(aParking({ availability: Availability.reported(0, minutesAgo(12)) }).pinState(NOW)).toBe('full');
    });

    it('est gris (« unknown ») sans signalement ou après expiration', () => {
      expect(aParking().pinState(NOW)).toBe('unknown');
      expect(aParking({ availability: Availability.reported(0, minutesAgo(15)) }).pinState(NOW)).toBe('unknown');
    });
  });

  it('est vérifié selon son score', () => {
    expect(aParking({ score: ParkingScore.of(11, 0) }).isVerified()).toBe(true);
    expect(aParking({ score: ParkingScore.of(11, 1) }).isVerified()).toBe(false);
  });

  it('renvoie une nouvelle instance avec une autre distance', () => {
    const parking = aParking({ distanceMeters: 100 });

    const moved = parking.withDistance(900);

    expect(moved.distanceMeters).toBe(900);
    expect(parking.distanceMeters).toBe(100);
  });

  it('survit à un aller-retour par son snapshot (cache, hors ligne)', () => {
    const parking = aParking({
      photos: ['https://res.cloudinary.com/demo/p.jpg'],
      availability: Availability.reported(5, minutesAgo(4)),
      score: ParkingScore.of(12, 1),
    });

    const snapshot = JSON.parse(JSON.stringify(parking.toSnapshot())) as ReturnType<
      typeof parking.toSnapshot
    >;
    const restored = ParkingSummary.fromSnapshot(snapshot);

    expect(restored).toBeInstanceOf(ParkingSummary);
    expect(restored.toSnapshot()).toEqual(parking.toSnapshot());
    expect(restored.pinState(NOW)).toBe('recent');
    expect(restored.isVerified()).toBe(true);
    expect(restored.coverPhoto).toBe('https://res.cloudinary.com/demo/p.jpg');
  });
});
