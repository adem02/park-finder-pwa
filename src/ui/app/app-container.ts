import type { LocateUser } from '@application/location/locate-user.use-case';
import type { FindNearbyParkings } from '@application/parking/find-nearby-parkings.use-case';
import type { Clock } from '@application/ports/clock.port';

/** Ce dont l'UI a besoin. main/ construit un objet conforme et le fournit via le contexte. */
export interface UseCases {
  readonly findNearbyParkings: FindNearbyParkings;
  readonly locateUser: LocateUser;
}

export interface AppContainer {
  readonly useCases: UseCases;
  readonly clock: Clock;
  readonly dataSource: 'demo' | 'api';
}
