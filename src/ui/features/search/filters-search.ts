import { SEARCH_RADIUS_VALUES } from '@domain/geo/search-radius';
import {
  ParkingFilters,
  isParkingSort,
  type ParkingFiltersInput,
  type ParkingSort,
} from '@domain/search/parking-filters';

/**
 * Filtres tels qu'ils vivent dans l'URL (`/?radius=5000&verified=true`), partagés par la carte et la liste.
 * Seuls les critères qui s'écartent des valeurs par défaut y figurent : l'URL reste courte et partageable.
 */
export interface FiltersSearch {
  readonly radius?: number;
  readonly minSpots?: number;
  readonly available?: true;
  readonly verified?: true;
  readonly sort?: Exclude<ParkingSort, 'distance'>;
}

const asNumber = (value: unknown): number | undefined => {
  const number = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  return typeof number === 'number' && Number.isFinite(number) ? number : undefined;
};

const isTrue = (value: unknown): boolean => value === true || value === 'true' || value === 1;

/**
 * `validateSearch` des routes à onglets. Une URL bricolée ne casse jamais l'écran :
 * toute valeur inconnue est ignorée et le critère retombe sur sa valeur par défaut.
 */
export function validateFiltersSearch(raw: Record<string, unknown>): FiltersSearch {
  const radius = asNumber(raw.radius);
  const minSpots = asNumber(raw.minSpots);
  const filters = ParkingFilters.DEFAULT;

  return {
    ...(radius !== undefined &&
    radius !== filters.radius.meters &&
    (SEARCH_RADIUS_VALUES as readonly number[]).includes(radius)
      ? { radius }
      : {}),
    ...(minSpots !== undefined && Number.isInteger(minSpots) && minSpots > 0 ? { minSpots } : {}),
    ...(isTrue(raw.available) ? { available: true as const } : {}),
    ...(isTrue(raw.verified) ? { verified: true as const } : {}),
    ...(isParkingSort(raw.sort) && raw.sort !== 'distance' ? { sort: raw.sort } : {}),
  };
}

export const toFiltersInput = (search: FiltersSearch): ParkingFiltersInput => ({
  radiusMeters: search.radius,
  minSpots: search.minSpots,
  availableOnly: search.available,
  verifiedOnly: search.verified,
  sort: search.sort,
});

/** Filtres de l'URL, déjà validés par `validateFiltersSearch` : la création ne peut pas échouer. */
export const filtersFromSearch = (search: FiltersSearch): ParkingFilters => {
  const filters = ParkingFilters.create(toFiltersInput(search));
  return filters.ok ? filters.value : ParkingFilters.DEFAULT;
};

export const toFiltersSearch = (filters: ParkingFilters): FiltersSearch =>
  validateFiltersSearch({
    radius: filters.radius.meters,
    minSpots: filters.minSpots,
    available: filters.availableOnly,
    verified: filters.verifiedOnly,
    sort: filters.sort,
  });
