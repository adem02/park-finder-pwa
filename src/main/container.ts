import { LocateUser } from '@application/location/locate-user.use-case';
import { FindNearbyParkings } from '@application/parking/find-nearby-parkings.use-case';
import type { GeolocationPort } from '@application/ports/geolocation.port';
import type { ParkingGateway } from '@application/ports/parking.gateway';
import { BrowserGeolocation } from '@infrastructure/browser/browser-geolocation';
import { FetchHttpClient } from '@infrastructure/http/fetch-http-client';
import { HttpParkingGateway } from '@infrastructure/http/http-parking.gateway';
import { FakeGeolocation } from '@infrastructure/in-memory/fake-geolocation';
import { InMemoryParkingGateway } from '@infrastructure/in-memory/in-memory-parking.gateway';
import {
  REIMS_DEMO_POSITION,
  createReimsDemoParkings,
} from '@infrastructure/in-memory/reims-demo-parkings';
import { SystemClock } from '@infrastructure/time/system-clock';
import type { AppContainer } from '@ui/app/app-container';
import type { Env } from './env';

/**
 * Composition root : le seul endroit qui connaît les implémentations concrètes.
 * En démo, les parkings de Reims sont en mémoire et l'utilisateur est placé au centre de Reims.
 */
export function createContainer(env: Env): AppContainer {
  const clock = new SystemClock();

  let parkings: ParkingGateway;
  let geolocation: GeolocationPort;

  if (env.dataSource === 'api') {
    const http = new FetchHttpClient({ baseUrl: env.apiUrl });
    parkings = new HttpParkingGateway(http);
    geolocation = new BrowserGeolocation();
  } else {
    parkings = new InMemoryParkingGateway(createReimsDemoParkings(clock.now()));
    geolocation = FakeGeolocation.at(REIMS_DEMO_POSITION);
  }

  return {
    clock,
    dataSource: env.dataSource,
    useCases: {
      findNearbyParkings: new FindNearbyParkings(parkings),
      locateUser: new LocateUser(geolocation),
    },
  };
}
