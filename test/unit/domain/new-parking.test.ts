import { describe, expect, it } from 'vitest';
import { InvalidNewParkingError, NewParking } from '@domain/parking/new-parking';

const valid = { name: '  Parking du marché ', totalSpots: 40, latitude: 49.25, longitude: 4.03, photoCount: 0 };

const problemsOf = (input: typeof valid) => {
  const result = NewParking.create(input);
  return !result.ok && result.error instanceof InvalidNewParkingError ? result.error.problems : null;
};

describe('NewParking', () => {
  it('accepte un parking valide, nom nettoyé, sans photo', () => {
    const result = NewParking.create(valid);

    expect(result.ok && result.value.name).toBe('Parking du marché');
    expect(result.ok && result.value.coordinates.toSnapshot()).toEqual({ latitude: 49.25, longitude: 4.03 });
  });

  it('applique les bornes de l’API', () => {
    expect(problemsOf({ ...valid, name: 'ab', totalSpots: 0 })).toEqual({
      name: 'too-short',
      totalSpots: 'out-of-range',
    });
    expect(problemsOf({ ...valid, name: 'x'.repeat(101), totalSpots: 1001 })).toEqual({
      name: 'too-long',
      totalSpots: 'out-of-range',
    });
    expect(problemsOf({ ...valid, totalSpots: 2.5 })).toEqual({ totalSpots: 'out-of-range' });
  });

  it('refuse plus de 3 photos et des coordonnées invalides', () => {
    expect(problemsOf({ ...valid, photoCount: 4, latitude: 120 })).toEqual({
      photos: 'too-many',
      coordinates: 'required',
    });
  });
});
