import { useMemo, useState } from 'react';
import type { ParkingFilters } from '@domain/search/parking-filters';
import { useContainer } from '../../app/container-context';
import { useNow } from '../../hooks/use-now';
import { locationFallbackMessage } from '../location/messages';
import { useUserLocation } from '../location/use-user-location';
import { ActiveFilterChips } from './active-filter-chips';
import { parkingsCountLabel } from './filter-labels';
import { FiltersButton } from './filters-button';
import { FiltersSheet } from './filters-sheet';
import { ListEmptyState } from './list-empty-state';
import { nearbyErrorMessage } from './messages';
import { ParkingRow } from './parking-row';
import { useNearbyParkings } from './use-nearby-parkings';
import styles from './search.module.css';

export interface SearchPageProps {
  /** Filtres en cours (lus dans l'URL par la route). */
  filters: ParkingFilters;
  onFiltersChange: (filters: ParkingFilters) => void;
}

const SKELETON_ROWS = 4;

/** Onglet « Liste » : les parkings autour de l'utilisateur, filtrés et triés. */
export function ListPage({ filters, onFiltersChange }: SearchPageProps) {
  const { dataSource } = useContainer();
  const location = useUserLocation();
  const now = useNow();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const position = useMemo(() => location.data?.position.toSnapshot() ?? null, [location.data]);
  const parkings = useNearbyParkings(position, filters);
  const count = parkings.data?.length;

  return (
    <main className={styles.listPage}>
      <header className={styles.listHeader}>
        <div className={styles.listTitles}>
          <h1 className={styles.listTitle}>Parkings à proximité</h1>
          <p className={styles.listCount} aria-live="polite">
            {count === undefined ? 'Chargement…' : parkingsCountLabel(count, filters.radius.meters)}
          </p>
        </div>
        {dataSource === 'demo' && <span className={styles.demo}>Démo</span>}
        <FiltersButton activeCount={filters.activeCount()} onClick={() => setFiltersOpen(true)} />
      </header>

      <div className={styles.listBody}>
        <ActiveFilterChips filters={filters} onChange={onFiltersChange} />

        {location.data?.source === 'fallback' && (
          <p className={styles.banner} role="status">
            {locationFallbackMessage(location.data.reason)}
          </p>
        )}

        {parkings.isError && (
          <p className={`${styles.banner} ${styles.bannerError}`} role="alert">
            {nearbyErrorMessage(parkings.error)}{' '}
            <button type="button" className={styles.retry} onClick={() => void parkings.refetch()}>
              Réessayer
            </button>
          </p>
        )}

        {parkings.data === undefined ? (
          !parkings.isError && (
            <ul className={styles.results} aria-busy="true" aria-label="Chargement des parkings">
              {Array.from({ length: SKELETON_ROWS }, (_, index) => (
                <li key={index} className={styles.skeleton} />
              ))}
            </ul>
          )
        ) : parkings.data.length === 0 ? (
          <ListEmptyState filters={filters} onFiltersChange={onFiltersChange} />
        ) : (
          <ul
            className={styles.results}
            aria-label="Résultats"
            aria-busy={parkings.isPlaceholderData || undefined}
            data-stale={parkings.isPlaceholderData || undefined}
          >
            {parkings.data.map((parking) => (
              <li key={parking.id}>
                <ParkingRow parking={parking} now={now} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <FiltersSheet
        open={filtersOpen}
        filters={filters}
        onClose={() => setFiltersOpen(false)}
        onApply={onFiltersChange}
      />
    </main>
  );
}
