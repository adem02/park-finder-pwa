import { describe, expect, it } from 'vitest';
import { Coordinates, InvalidCoordinatesError } from '@domain/geo/coordinates';

describe('Coordinates', () => {
  it('accepte des coordonnées valides', () => {
    const result = Coordinates.create(49.2583, 4.0317);

    expect(result.ok).toBe(true);
  });

  it.each([
    [91, 0],
    [-91, 0],
    [0, 181],
    [0, -181],
    [Number.NaN, 0],
    [0, Number.POSITIVE_INFINITY],
  ])('refuse (%s, %s)', (latitude, longitude) => {
    const result = Coordinates.create(latitude, longitude);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBeInstanceOf(InvalidCoordinatesError);
  });

  it('calcule la distance Reims – Paris (environ 130 km)', () => {
    const reims = Coordinates.fromSnapshot({ latitude: 49.2536, longitude: 4.0339 });
    const paris = Coordinates.fromSnapshot({ latitude: 48.853, longitude: 2.3499 });

    const km = reims.distanceTo(paris) / 1000;

    expect(km).toBeGreaterThan(125);
    expect(km).toBeLessThan(135);
  });

  it('a une distance nulle avec elle-même', () => {
    const point = Coordinates.fromSnapshot({ latitude: 49.25, longitude: 4.03 });

    expect(point.distanceTo(point)).toBe(0);
  });

  it('se sérialise et se réhydrate à l’identique', () => {
    const point = Coordinates.fromSnapshot({ latitude: 49.25, longitude: 4.03 });

    expect(Coordinates.fromSnapshot(point.toSnapshot()).equals(point)).toBe(true);
  });
});
