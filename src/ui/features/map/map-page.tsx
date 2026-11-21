import { useMemo, useRef, useState } from 'react';
import type { CoordinatesSnapshot } from '@domain/geo/coordinates';
import { SearchRadius } from '@domain/geo/search-radius';
import type { ParkingId } from '@domain/parking/parking-summary';
import { useContainer } from '../../app/container-context';
import { IconButton } from '../../components/icon-button';
import { LocateIcon } from '../../components/icons';
import { formatDistance } from '../../format/format-distance';
import { useDebouncedValue } from '../../hooks/use-debounced-value';
import { useHeightCssVariable } from '../../hooks/use-height-css-variable';
import { useNow } from '../../hooks/use-now';
import { MapView, type MapViewHandle } from '../../map/map-view';
import { ParkingFeaturePresenter } from '../../map/parking-feature.presenter';
import { locationFallbackMessage, nearbyErrorMessage } from './messages';
import { ParkingPreviewCard } from './parking-preview-card';
import { PinLegend } from './pin-legend';
import { useNearbyParkings } from './use-nearby-parkings';
import { useUserLocation } from './use-user-location';
import styles from './map-page.module.css';

export function MapPage() {
  const { dataSource } = useContainer();
  const location = useUserLocation();
  const [mapCenter, setMapCenter] = useState<CoordinatesSnapshot | null>(null);
  const debouncedCenter = useDebouncedValue(mapCenter, 400);
  const [selectedId, setSelectedId] = useState<ParkingId | null>(null);
  const mapRef = useRef<MapViewHandle>(null);
  const bottomPanelRef = useHeightCssVariable<HTMLDivElement>('--bottom-panel-height');
  const now = useNow();

  const userPosition = useMemo(
    () => location.data?.position.toSnapshot() ?? null,
    [location.data],
  );
  const parkings = useNearbyParkings(debouncedCenter ?? userPosition);

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
      <MapView
        ref={mapRef}
        initialCenter={userPosition}
        pins={pins}
        userPosition={location.data.source === 'device' ? userPosition : null}
        onMoveEnd={setMapCenter}
        onPinSelect={setSelectedId}
      />

      <div className={styles.top}>
        <header className={styles.topBar}>
          <h1 className={styles.title}>ParkFinder</h1>
          <p className={styles.count} aria-live="polite">
            {parkings.isFetching && count === undefined
              ? 'Chargement…'
              : `${count ?? 0} parking${(count ?? 0) > 1 ? 's' : ''} gratuit${(count ?? 0) > 1 ? 's' : ''} à ${formatDistance(SearchRadius.DEFAULT.meters)}`}
          </p>
          {dataSource === 'demo' && <span className={styles.demo}>Démo</span>}
        </header>

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
        <IconButton
          label="Me localiser"
          className={styles.locate}
          onClick={() => void recenter()}
          disabled={location.isFetching}
        >
          <LocateIcon />
        </IconButton>

        {selected ? (
          <ParkingPreviewCard parking={selected} now={now} onClose={() => setSelectedId(null)} />
        ) : (
          <PinLegend />
        )}
      </div>
    </main>
  );
}
