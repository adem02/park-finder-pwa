import { Link } from '@tanstack/react-router';
import { Suspense, useMemo, useRef, useState } from 'react';
import type { CoordinatesSnapshot } from '@domain/geo/coordinates';
import type { ParkingId } from '@domain/parking/parking-summary';
import { useContainer } from '../../app/container-context';
import { IconButton } from '../../components/icon-button';
import { LocateIcon, PlusIcon } from '../../components/icons';
import { useDebouncedValue } from '../../hooks/use-debounced-value';
import { useHeightCssVariable } from '../../hooks/use-height-css-variable';
import { useNow } from '../../hooks/use-now';
import { LazyMapView as MapView } from '../../map/lazy-map-view';
import type { MapViewHandle } from '../../map/map-view';
import { ParkingFeaturePresenter } from '../../map/parking-feature.presenter';
import { locationFallbackMessage } from '../location/messages';
import { useUserLocation } from '../location/use-user-location';
import { ActiveFilterChips } from '../search/active-filter-chips';
import { parkingsCountLabel } from '../search/filter-labels';
import { FiltersButton } from '../search/filters-button';
import { FiltersSheet } from '../search/filters-sheet';
import type { SearchPageProps } from '../search/list-page';
import { nearbyErrorMessage } from '../search/messages';
import { useNearbyParkings } from '../search/use-nearby-parkings';
import { ParkingPreviewCard } from './parking-preview-card';
import { PinLegend } from './pin-legend';
import styles from './map-page.module.css';

/** Onglet « Carte » : les parkings autour du centre de la carte, avec les mêmes filtres que la liste. */
export function MapPage({ filters, onFiltersChange }: SearchPageProps) {
  const { dataSource } = useContainer();
  const location = useUserLocation();
  const [mapCenter, setMapCenter] = useState<CoordinatesSnapshot | null>(null);
  const debouncedCenter = useDebouncedValue(mapCenter, 400);
  const [selectedId, setSelectedId] = useState<ParkingId | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const mapRef = useRef<MapViewHandle>(null);
  const bottomPanelRef = useHeightCssVariable<HTMLDivElement>('--bottom-panel-height');
  const now = useNow();

  const userPosition = useMemo(() => location.data?.position.toSnapshot() ?? null, [location.data]);
  const parkings = useNearbyParkings(debouncedCenter ?? userPosition, filters);

  const pins = useMemo(
    () => ParkingFeaturePresenter.toFeatureCollection(parkings.data ?? [], now, selectedId),
    [parkings.data, now, selectedId],
  );
  const selected = parkings.data?.find((parking) => parking.id === selectedId) ?? null;

  if (!location.data || !userPosition) {
    return (
      <div className={styles.splash} role="status">
        <LocateIcon className={styles.splashIcon} width={32} height={32} />
        Recherche de votre position…
      </div>
    );
  }

  const recenter = async () => {
    const { data } = await location.refetch();
    if (data) mapRef.current?.flyTo(data.position.toSnapshot());
  };

  const count = parkings.data?.length;

  return (
    <main className={styles.page}>
      <Suspense fallback={<div className={styles.mapPlaceholder} aria-hidden="true" />}>
        <MapView
          ref={mapRef}
          initialCenter={userPosition}
          pins={pins}
          userPosition={location.data.source === 'device' ? userPosition : null}
          onMoveEnd={setMapCenter}
          onPinSelect={setSelectedId}
        />
      </Suspense>

      <div className={styles.top}>
        <header className={styles.topBar}>
          <h1 className={styles.title}>PlaceGratos</h1>
          <p className={styles.count} aria-live="polite">
            {parkings.isFetching && count === undefined
              ? 'Chargement…'
              : parkingsCountLabel(count ?? 0, filters.radius.meters)}
          </p>
          {dataSource === 'demo' && <span className={styles.demo}>Démo</span>}
          <FiltersButton activeCount={filters.activeCount()} onClick={() => setFiltersOpen(true)} />
        </header>

        <ActiveFilterChips filters={filters} onChange={onFiltersChange} />

        {location.data.source === 'fallback' && (
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
      </div>

      <div ref={bottomPanelRef} className={styles.bottom}>
        <div className={styles.actions}>
          <Link
            to="/add"
            className={styles.fab}
            aria-label="Ajouter un parking"
            title="Ajouter un parking"
          >
            <PlusIcon width={26} height={26} />
          </Link>
          <IconButton
            label="Me localiser"
            onClick={() => void recenter()}
            disabled={location.isFetching}
          >
            <LocateIcon />
          </IconButton>
        </div>

        {selected ? (
          <ParkingPreviewCard parking={selected} now={now} onClose={() => setSelectedId(null)} />
        ) : (
          <PinLegend />
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
