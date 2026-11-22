import { describe, expect, it } from 'vitest';
import { Availability } from '@domain/availability/availability';
import { InvalidSearchRadiusError } from '@domain/geo/search-radius';
import { InvalidMinSpotsError, ParkingFilters } from '@domain/search/parking-filters';
import { ParkingScore } from '@domain/vote/parking-score';
import { NOW, aParking, filtersWith, minutesAgo } from '../../support/parking.builder';

describe('ParkingFilters', () => {
  it('a pour défaut 2 km, tous les parkings, tri par distance', () => {
    expect(ParkingFilters.DEFAULT.toSnapshot()).toEqual({
      radiusMeters: 2000,
      minSpots: 0,
      availableOnly: false,
      verifiedOnly: false,
      sort: 'distance',
    });
    expect(ParkingFilters.DEFAULT.activeCount()).toBe(0);
  });

  it('refuse un rayon non autorisé ou un minimum de places invalide', () => {
    const radius = ParkingFilters.create({ radiusMeters: 3000 });
    const negative = ParkingFilters.create({ minSpots: -5 });
    const decimal = ParkingFilters.create({ minSpots: 2.5 });

    expect(!radius.ok && radius.error).toBeInstanceOf(InvalidSearchRadiusError);
    expect(!negative.ok && negative.error).toBeInstanceOf(InvalidMinSpotsError);
    expect(!decimal.ok && decimal.error).toBeInstanceOf(InvalidMinSpotsError);
  });

  it('compte les critères modifiés, tri compris', () => {
    const filters = filtersWith({ radiusMeters: 5000, availableOnly: true, sort: 'recent' });

    expect(filters.activeCount()).toBe(3);
    expect(filters.restrictsResults()).toBe(true);
    expect(filtersWith({ sort: 'popularity' }).restrictsResults()).toBe(false);
  });

  describe('matches', () => {
    it('compare le minimum au nombre total de places', () => {
      const filters = filtersWith({ minSpots: 20 });

      expect(filters.matches(aParking({ totalSpots: 20 }), NOW)).toBe(true);
      expect(filters.matches(aParking({ totalSpots: 19 }), NOW)).toBe(false);
    });

    it('« dispo uniquement » exige un signalement non expiré avec au moins une place', () => {
      const filters = filtersWith({ availableOnly: true });
      const withSpots = aParking({ availability: Availability.reported(3, minutesAgo(5)) });
      const full = aParking({ availability: Availability.reported(0, minutesAgo(5)) });
      const expired = aParking({ availability: Availability.reported(8, minutesAgo(16)) });
      const unknown = aParking({ availability: Availability.none() });

      expect(filters.matches(withSpots, NOW)).toBe(true);
      expect(filters.matches(full, NOW)).toBe(false);
      expect(filters.matches(expired, NOW)).toBe(false);
      expect(filters.matches(unknown, NOW)).toBe(false);
    });

    it('« vérifiés uniquement » exige un score net > 10', () => {
      const filters = filtersWith({ verifiedOnly: true });

      expect(filters.matches(aParking({ score: ParkingScore.of(11, 0) }), NOW)).toBe(true);
      expect(filters.matches(aParking({ score: ParkingScore.of(12, 2) }), NOW)).toBe(false);
    });
  });

  describe('tri', () => {
    const near = aParking({ id: 'near', distanceMeters: 100, createdAt: new Date('2026-01-01'), score: ParkingScore.of(1, 0) });
    const mid = aParking({ id: 'mid', distanceMeters: 300, createdAt: new Date('2026-09-01'), score: ParkingScore.of(9, 0) });
    const far = aParking({ id: 'far', distanceMeters: 900, createdAt: new Date('2026-05-01'), score: ParkingScore.of(4, 0) });
    const ids = (sort: 'distance' | 'recent' | 'popularity') =>
      filtersWith({ sort }).sortParkings([far, near, mid]).map((p) => p.id);

    it('par distance, ajout le plus récent ou score net', () => {
      expect(ids('distance')).toEqual(['near', 'mid', 'far']);
      expect(ids('recent')).toEqual(['mid', 'far', 'near']);
      expect(ids('popularity')).toEqual(['mid', 'far', 'near']);
    });

    it('conserve l’ordre reçu à égalité', () => {
      const a = aParking({ id: 'a', score: ParkingScore.of(2, 0) });
      const b = aParking({ id: 'b', score: ParkingScore.of(2, 0) });

      expect(filtersWith({ sort: 'popularity' }).sortParkings([a, b]).map((p) => p.id)).toEqual(['a', 'b']);
    });
  });

  it('remet un seul critère à sa valeur par défaut', () => {
    const filters = filtersWith({ radiusMeters: 5000, verifiedOnly: true, sort: 'recent' });

    const withoutVerified = filters.reset('verifiedOnly');

    expect(withoutVerified.activeCriteria()).toEqual(['radius', 'sort']);
    expect(filters.verifiedOnly).toBe(true);
  });

  it('propose le rayon supérieur, sauf au maximum', () => {
    expect(filtersWith({ radiusMeters: 2000 }).widerRadius()?.meters).toBe(5000);
    expect(filtersWith({ radiusMeters: 10000 }).widerRadius()).toBeNull();
  });
});
