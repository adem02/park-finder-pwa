import { describe, expect, it } from 'vitest';
import {
  InvalidSearchRadiusError,
  SEARCH_RADIUS_VALUES,
  SearchRadius,
} from '@domain/geo/search-radius';

describe('SearchRadius', () => {
  it('propose les rayons 500 m, 1, 2, 5 et 10 km', () => {
    expect(SEARCH_RADIUS_VALUES).toEqual([500, 1000, 2000, 5000, 10000]);
  });

  it('vaut 2 km par défaut', () => {
    expect(SearchRadius.DEFAULT.meters).toBe(2000);
  });

  it.each([
    [500, 10],
    [1000, 15],
    [2000, 20],
    [5000, 50],
    [10000, 100],
  ])('limite le rayon %s m à %s résultats', (meters, maxResults) => {
    const radius = SearchRadius.create(meters);

    expect(radius.ok && radius.value.maxResults).toBe(maxResults);
  });

  it('refuse un rayon non autorisé', () => {
    const radius = SearchRadius.create(300);

    expect(radius.ok).toBe(false);
    if (!radius.ok) expect(radius.error).toBeInstanceOf(InvalidSearchRadiusError);
  });

  it('contient une distance égale au rayon, pas au-delà', () => {
    const radius = SearchRadius.DEFAULT;

    expect(radius.contains(2000)).toBe(true);
    expect(radius.contains(2001)).toBe(false);
  });
});
