import { useMemo } from 'react';
import { Coordinates, type CoordinatesSnapshot } from '@domain/geo/coordinates';
import { DUPLICATE_PARKING_RADIUS_METERS } from '@domain/parking/new-parking';
import { ParkingFilters } from '@domain/search/parking-filters';
import { useNearbyParkings } from '../search/use-nearby-parkings';

/** 500 m autour du repère couvrent largement les 50 m de la règle anti-doublon de l'API. */
const NEIGHBOURS = ParkingFilters.fromSnapshot({
  radiusMeters: 500,
  minSpots: 0,
  availableOnly: false,
  verifiedOnly: false,
  sort: 'distance',
});

/**
 * Parkings voisins du repère et, s'il y en a un à moins de 50 m, ce doublon :
 * on prévient dès l'étape 1 au lieu de laisser l'API refuser après la saisie.
 */
export function useDuplicateCheck(center: CoordinatesSnapshot | null) {
  const neighbours = useNearbyParkings(center, NEIGHBOURS);

  const duplicate = useMemo(() => {
    if (!center) return null;
    const point = Coordinates.fromSnapshot(center);
    const parking =
      neighbours.data?.find(
        (candidate) => candidate.coordinates.distanceTo(point) <= DUPLICATE_PARKING_RADIUS_METERS,
      ) ?? null;
    return parking ? { parking, distanceMeters: parking.coordinates.distanceTo(point) } : null;
  }, [neighbours.data, center]);

  return { neighbours: neighbours.data ?? [], duplicate };
}
