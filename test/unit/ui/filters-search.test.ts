import { describe, expect, it } from 'vitest';
import { ParkingFilters } from '@domain/search/parking-filters';
import {
  filtersFromSearch,
  toFiltersSearch,
  validateFiltersSearch,
} from '@ui/features/search/filters-search';
import { filtersWith } from '../../support/parking.builder';

describe('Filtres dans l’URL', () => {
  it('garde les critères valides, y compris sous forme de texte', () => {
    expect(
      validateFiltersSearch({ radius: '5000', minSpots: 10, available: 'true', verified: true, sort: 'recent' }),
    ).toEqual({ radius: 5000, minSpots: 10, available: true, verified: true, sort: 'recent' });
  });

  it('ignore les valeurs inconnues ou par défaut au lieu de casser l’écran', () => {
    expect(
      validateFiltersSearch({ radius: 3000, minSpots: -2, available: 'oui', sort: 'prix', foo: 'bar' }),
    ).toEqual({});
    expect(validateFiltersSearch({ radius: 2000, minSpots: 0, sort: 'distance' })).toEqual({});
  });

  it('fait l’aller-retour filtres → URL → filtres', () => {
    const filters = filtersWith({ radiusMeters: 10000, minSpots: 20, verifiedOnly: true, sort: 'popularity' });

    expect(filtersFromSearch(toFiltersSearch(filters)).toSnapshot()).toEqual(filters.toSnapshot());
    expect(toFiltersSearch(ParkingFilters.DEFAULT)).toEqual({});
  });
});
