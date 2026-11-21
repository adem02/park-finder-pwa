import { DomainError } from '../shared/domain-error';
import { err, ok, type Result } from '../shared/result';

/** Rayons autorisés et nombre max de résultats associés (docs/decisions.md). */
const MAX_RESULTS_BY_RADIUS = {
  500: 10,
  1000: 15,
  2000: 20,
  5000: 50,
  10000: 100,
} as const;

export type SearchRadiusMeters = keyof typeof MAX_RESULTS_BY_RADIUS;

export const SEARCH_RADIUS_VALUES = Object.keys(MAX_RESULTS_BY_RADIUS).map(
  Number,
) as SearchRadiusMeters[];

export class InvalidSearchRadiusError extends DomainError {
  readonly kind = 'InvalidSearchRadius';

  constructor(readonly meters: number) {
    super(`Rayon de recherche non autorisé : ${meters} m.`);
  }
}

const isAllowedRadius = (meters: number): meters is SearchRadiusMeters =>
  Object.hasOwn(MAX_RESULTS_BY_RADIUS, meters);

export class SearchRadius {
  /** Rayon par défaut de l'app : 2 km. */
  static readonly DEFAULT = new SearchRadius(2000);

  private constructor(readonly meters: SearchRadiusMeters) {}

  static create(meters: number): Result<SearchRadius, InvalidSearchRadiusError> {
    return isAllowedRadius(meters)
      ? ok(new SearchRadius(meters))
      : err(new InvalidSearchRadiusError(meters));
  }

  get maxResults(): number {
    return MAX_RESULTS_BY_RADIUS[this.meters];
  }

  contains(distanceMeters: number): boolean {
    return distanceMeters <= this.meters;
  }

  /** Rayon autorisé immédiatement supérieur, ou `null` pour le plus grand. */
  next(): SearchRadius | null {
    const wider = SEARCH_RADIUS_VALUES.find((meters) => meters > this.meters);
    return wider === undefined ? null : new SearchRadius(wider);
  }
}
