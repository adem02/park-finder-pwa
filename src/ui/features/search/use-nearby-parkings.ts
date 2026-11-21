import { keepPreviousData, skipToken, useQuery } from '@tanstack/react-query';
import type { CoordinatesSnapshot } from '@domain/geo/coordinates';
import { ParkingSummary, type ParkingSummarySnapshot } from '@domain/parking/parking-summary';
import type { ParkingFilters } from '@domain/search/parking-filters';
import { useUseCases } from '../../app/container-context';
import { parkingKeys } from '../../query/query-keys';
import { unwrap } from '../../query/unwrap';

/** 3 décimales ≈ 100 m : on ne relance pas la recherche à chaque petit glissement de carte. */
const roundCoordinate = (value: number): number => Math.round(value * 1000) / 1000;

/** Fonction stable : TanStack Query mémoïse le résultat de `select` tant que les données ne changent pas. */
const toParkings = (snapshots: readonly ParkingSummarySnapshot[]): ParkingSummary[] =>
  snapshots.map((snapshot) => ParkingSummary.fromSnapshot(snapshot));

/** Parkings autour de `center` selon les filtres. Partagé par la carte et la liste (même cache). */
export function useNearbyParkings(center: CoordinatesSnapshot | null, filters: ParkingFilters) {
  const { findNearbyParkings } = useUseCases();
  const latitude = center ? roundCoordinate(center.latitude) : Number.NaN;
  const longitude = center ? roundCoordinate(center.longitude) : Number.NaN;
  const criteria = filters.toSnapshot();

  return useQuery({
    queryKey: parkingKeys.nearby(latitude, longitude, criteria),
    queryFn: center
      ? async ({ signal }) => {
          const parkings = await unwrap(
            findNearbyParkings.execute({ latitude, longitude, filters: criteria }, signal),
          );
          return parkings.map((parking) => parking.toSnapshot());
        }
      : skipToken,
    select: toParkings,
    placeholderData: keepPreviousData,
  });
}
