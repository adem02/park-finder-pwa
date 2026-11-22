import { SearchRadius, type InvalidSearchRadiusError, type SearchRadiusMeters } from '../geo/search-radius';
import type { ParkingSummary } from '../parking/parking-summary';
import { DomainError } from '../shared/domain-error';
import { err, ok, type Result } from '../shared/result';

/** Tris proposés par l'API : `distance` (défaut), `recent` (ajout le plus récent), `popularity` (score net). */
export const PARKING_SORT_VALUES = ['distance', 'recent', 'popularity'] as const;
export type ParkingSort = (typeof PARKING_SORT_VALUES)[number];

/** Paliers « places minimum » proposés dans l'app (docs/decisions.md). L'API accepte tout entier ≥ 0. */
export const MIN_SPOTS_OPTIONS = [0, 5, 10, 20, 50] as const;

/** Les critères d'une recherche, dans l'ordre d'affichage. */
export const PARKING_CRITERIA = ['radius', 'minSpots', 'availableOnly', 'verifiedOnly', 'sort'] as const;
export type ParkingCriterion = (typeof PARKING_CRITERIA)[number];

export const isParkingSort = (value: unknown): value is ParkingSort =>
  (PARKING_SORT_VALUES as readonly unknown[]).includes(value);

export class InvalidMinSpotsError extends DomainError {
  readonly kind = 'InvalidMinSpots';

  constructor(readonly minSpots: number) {
    super(`Nombre de places minimum invalide : ${minSpots}.`);
  }
}

export interface ParkingFiltersInput {
  readonly radiusMeters?: number;
  readonly minSpots?: number;
  readonly availableOnly?: boolean;
  readonly verifiedOnly?: boolean;
  readonly sort?: ParkingSort;
}

export interface ParkingFiltersSnapshot {
  readonly radiusMeters: SearchRadiusMeters;
  readonly minSpots: number;
  readonly availableOnly: boolean;
  readonly verifiedOnly: boolean;
  readonly sort: ParkingSort;
}

interface ParkingFiltersProps {
  readonly radius: SearchRadius;
  readonly minSpots: number;
  readonly availableOnly: boolean;
  readonly verifiedOnly: boolean;
  readonly sort: ParkingSort;
}

const byDistance = (a: ParkingSummary, b: ParkingSummary) => a.distanceMeters - b.distanceMeters;
const byMostRecent = (a: ParkingSummary, b: ParkingSummary) =>
  b.createdAt.getTime() - a.createdAt.getTime();
const byPopularity = (a: ParkingSummary, b: ParkingSummary) => b.score.net - a.score.net;

const COMPARATORS: Record<ParkingSort, (a: ParkingSummary, b: ParkingSummary) => number> = {
  distance: byDistance,
  recent: byMostRecent,
  popularity: byPopularity,
};

/**
 * Critères d'une recherche à proximité. Mêmes règles que `FindNearbyParkingsUseCase` côté API :
 * - places minimum : sur le nombre **total** de places ;
 * - dispo uniquement : signalement non expiré avec au moins une place ;
 * - vérifiés uniquement : score net > 10.
 */
export class ParkingFilters {
  static readonly DEFAULT = new ParkingFilters({
    radius: SearchRadius.DEFAULT,
    minSpots: 0,
    availableOnly: false,
    verifiedOnly: false,
    sort: 'distance',
  });

  private constructor(private readonly props: ParkingFiltersProps) {}

  static create(
    input: ParkingFiltersInput = {},
  ): Result<ParkingFilters, InvalidSearchRadiusError | InvalidMinSpotsError> {
    const defaults = ParkingFilters.DEFAULT.props;

    const radius =
      input.radiusMeters === undefined ? ok(defaults.radius) : SearchRadius.create(input.radiusMeters);
    if (!radius.ok) return radius;

    const minSpots = input.minSpots ?? defaults.minSpots;
    if (!Number.isInteger(minSpots) || minSpots < 0) return err(new InvalidMinSpotsError(minSpots));

    return ok(
      new ParkingFilters({
        radius: radius.value,
        minSpots,
        availableOnly: input.availableOnly ?? defaults.availableOnly,
        verifiedOnly: input.verifiedOnly ?? defaults.verifiedOnly,
        sort: input.sort ?? defaults.sort,
      }),
    );
  }

  static fromSnapshot(snapshot: ParkingFiltersSnapshot): ParkingFilters {
    const filters = ParkingFilters.create(snapshot);
    if (!filters.ok) throw filters.error;
    return filters.value;
  }

  get radius(): SearchRadius {
    return this.props.radius;
  }

  get minSpots(): number {
    return this.props.minSpots;
  }

  get availableOnly(): boolean {
    return this.props.availableOnly;
  }

  get verifiedOnly(): boolean {
    return this.props.verifiedOnly;
  }

  get sort(): ParkingSort {
    return this.props.sort;
  }

  matches(parking: ParkingSummary, now: Date): boolean {
    if (parking.totalSpots < this.props.minSpots) return false;
    if (this.props.availableOnly && !((parking.availableSpotsAt(now) ?? 0) > 0)) return false;
    if (this.props.verifiedOnly && !parking.isVerified()) return false;
    return true;
  }

  /** Nouveau tableau trié ; à score ou date égale, l'ordre reçu (par distance) est conservé. */
  sortParkings(parkings: readonly ParkingSummary[]): ParkingSummary[] {
    return [...parkings].sort(COMPARATORS[this.props.sort]);
  }

  apply(parkings: readonly ParkingSummary[], now: Date): ParkingSummary[] {
    return this.sortParkings(parkings.filter((parking) => this.matches(parking, now)));
  }

  /** Critères qui s'écartent des valeurs par défaut. */
  activeCriteria(): ParkingCriterion[] {
    const defaults = ParkingFilters.DEFAULT.props;
    const isActive: Record<ParkingCriterion, boolean> = {
      radius: this.props.radius.meters !== defaults.radius.meters,
      minSpots: this.props.minSpots !== defaults.minSpots,
      availableOnly: this.props.availableOnly !== defaults.availableOnly,
      verifiedOnly: this.props.verifiedOnly !== defaults.verifiedOnly,
      sort: this.props.sort !== defaults.sort,
    };
    return PARKING_CRITERIA.filter((criterion) => isActive[criterion]);
  }

  /** Nombre de critères modifiés (pastille du bouton « Filtres »). */
  activeCount(): number {
    return this.activeCriteria().length;
  }

  /** Vrai si un critère peut retirer des résultats (le rayon et le tri n'en retirent aucun). */
  restrictsResults(): boolean {
    return this.activeCriteria().some(
      (criterion) => criterion === 'minSpots' || criterion === 'availableOnly' || criterion === 'verifiedOnly',
    );
  }

  /** Copie avec ce critère remis à sa valeur par défaut. */
  reset(criterion: ParkingCriterion): ParkingFilters {
    return new ParkingFilters({ ...this.props, [criterion]: ParkingFilters.DEFAULT.props[criterion] });
  }

  /** Copie avec un autre rayon (bouton « Élargir à 5 km »). */
  withRadius(radius: SearchRadius): ParkingFilters {
    return new ParkingFilters({ ...this.props, radius });
  }

  /** Rayon autorisé immédiatement supérieur, pour proposer d'élargir la recherche. */
  widerRadius(): SearchRadius | null {
    return this.props.radius.next();
  }

  toSnapshot(): ParkingFiltersSnapshot {
    const { props } = this;
    return {
      radiusMeters: props.radius.meters,
      minSpots: props.minSpots,
      availableOnly: props.availableOnly,
      verifiedOnly: props.verifiedOnly,
      sort: props.sort,
    };
  }
}
