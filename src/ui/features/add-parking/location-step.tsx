import { Link } from '@tanstack/react-router';
import { Suspense, useMemo, useRef } from 'react';
import type { CoordinatesSnapshot } from '@domain/geo/coordinates';
import type { ParkingSummary } from '@domain/parking/parking-summary';
import { IconButton } from '../../components/icon-button';
import { LocateIcon, ParkingIcon } from '../../components/icons';
import { formatDistance } from '../../format/format-distance';
import { useNow } from '../../hooks/use-now';
import { LazyMapView } from '../../map/lazy-map-view';
import type { MapViewHandle } from '../../map/map-view';
import { ParkingFeaturePresenter } from '../../map/parking-feature.presenter';
import { useUserLocation } from '../location/use-user-location';
import type { useDuplicateCheck } from './use-duplicate-check';
import styles from './add-parking.module.css';

interface LocationStepProps {
  initialCenter: CoordinatesSnapshot;
  neighbours: readonly ParkingSummary[];
  duplicate: ReturnType<typeof useDuplicateCheck>['duplicate'];
  onCenterChange: (center: CoordinatesSnapshot) => void;
}

/** Étape 1 : on déplace la carte pour placer le repère central sur l'entrée du parking. Pas d'adresse (décision 5). */
export function LocationStep({
  initialCenter,
  neighbours,
  duplicate,
  onCenterChange,
}: LocationStepProps) {
  const mapRef = useRef<MapViewHandle>(null);
  const location = useUserLocation();
  const now = useNow();

  const pins = useMemo(
    () =>
      ParkingFeaturePresenter.toFeatureCollection(neighbours, now, duplicate?.parking.id ?? null),
    [neighbours, now, duplicate],
  );

  const recenter = async () => {
    const { data } = await location.refetch();
    if (data) mapRef.current?.flyTo(data.position.toSnapshot());
  };

  return (
    <div className={styles.locationStep}>
      <div className={styles.mapArea}>
        <Suspense fallback={<div className={styles.mapPlaceholder} aria-hidden="true" />}>
          <LazyMapView
            ref={mapRef}
            initialCenter={initialCenter}
            pins={pins}
            userPosition={
              location.data?.source === 'device' ? location.data.position.toSnapshot() : null
            }
            onMoveEnd={onCenterChange}
            onPinSelect={() => undefined}
          />
        </Suspense>
        <ParkingIcon className={styles.crosshair} width={40} height={40} aria-hidden="true" />
        <IconButton
          label="Ma position actuelle"
          className={styles.locate}
          onClick={() => void recenter()}
          disabled={location.isFetching}
        >
          <LocateIcon />
        </IconButton>
      </div>

      {duplicate ? (
        <p className={`${styles.notice} ${styles.noticeWarning}`} role="alert">
          « {duplicate.parking.name} » est déjà référencé à{' '}
          {formatDistance(duplicate.distanceMeters)}.{' '}
          <Link
            to="/parking/$parkingId"
            params={{ parkingId: duplicate.parking.id }}
            className={styles.noticeLink}
          >
            Voir ce parking
          </Link>
        </p>
      ) : (
        <p className={styles.notice}>
          Déplacez la carte pour placer le repère sur l’entrée du parking.
        </p>
      )}
    </div>
  );
}
