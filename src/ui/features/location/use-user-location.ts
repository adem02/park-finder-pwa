import { useQuery } from '@tanstack/react-query';
import type { GeolocationError } from '@application/ports/geolocation.port';
import type { UserLocation } from '@application/location/locate-user.use-case';
import { Coordinates, type CoordinatesSnapshot } from '@domain/geo/coordinates';
import { useUseCases } from '../../app/container-context';
import { locationKeys } from '../../query/query-keys';

/** Forme sérialisable stockée dans le cache. */
type UserLocationSnapshot =
  | { source: 'device'; position: CoordinatesSnapshot }
  | { source: 'fallback'; position: CoordinatesSnapshot; reason: GeolocationError['reason'] };

const toSnapshot = (location: UserLocation): UserLocationSnapshot =>
  location.source === 'device'
    ? { source: 'device', position: location.position.toSnapshot() }
    : { source: 'fallback', position: location.position.toSnapshot(), reason: location.reason };

const fromSnapshot = (snapshot: UserLocationSnapshot): UserLocation =>
  snapshot.source === 'device'
    ? { source: 'device', position: Coordinates.fromSnapshot(snapshot.position) }
    : {
        source: 'fallback',
        position: Coordinates.fromSnapshot(snapshot.position),
        reason: snapshot.reason,
      };

export function useUserLocation() {
  const { locateUser } = useUseCases();

  return useQuery({
    queryKey: locationKeys.current,
    queryFn: async () => toSnapshot(await locateUser.execute()),
    select: fromSnapshot,
    staleTime: Infinity,
    retry: false,
  });
}
