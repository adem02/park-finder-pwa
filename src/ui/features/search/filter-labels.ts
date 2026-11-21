import { SEARCH_RADIUS_VALUES, type SearchRadiusMeters } from '@domain/geo/search-radius';
import {
  MIN_SPOTS_OPTIONS,
  PARKING_SORT_VALUES,
  type ParkingCriterion,
  type ParkingFilters,
  type ParkingSort,
} from '@domain/search/parking-filters';
import type { Choice } from '../../components/choice-chips';
import { formatDistance } from '../../format/format-distance';

const SORT_LABELS: Record<ParkingSort, string> = {
  distance: 'Distance',
  recent: 'Ajoutés récemment',
  popularity: 'Popularité',
};

export const RADIUS_CHOICES: readonly Choice<SearchRadiusMeters>[] = SEARCH_RADIUS_VALUES.map(
  (meters) => ({ value: meters, label: formatDistance(meters) }),
);

export const MIN_SPOTS_CHOICES: readonly Choice<number>[] = MIN_SPOTS_OPTIONS.map((value) => ({
  value,
  label: value === 0 ? 'Tous' : `${value}+`,
}));

export const SORT_CHOICES: readonly Choice<ParkingSort>[] = PARKING_SORT_VALUES.map((value) => ({
  value,
  label: SORT_LABELS[value],
}));

/** Libellé de la pastille d'un critère actif, affichée au-dessus des résultats. */
export function criterionLabel(criterion: ParkingCriterion, filters: ParkingFilters): string {
  switch (criterion) {
    case 'radius':
      return `Rayon ${formatDistance(filters.radius.meters)}`;
    case 'minSpots':
      return `${filters.minSpots}+ places`;
    case 'availableOnly':
      return 'Places dispo';
    case 'verifiedOnly':
      return 'Vérifiés';
    case 'sort':
      return `Tri : ${SORT_LABELS[filters.sort].toLowerCase()}`;
  }
}

export const parkingsCountLabel = (count: number, radiusMeters: number): string =>
  `${count} parking${count > 1 ? 's' : ''} gratuit${count > 1 ? 's' : ''} à ${formatDistance(radiusMeters)}`;
