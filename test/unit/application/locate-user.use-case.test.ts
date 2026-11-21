import { describe, expect, it } from 'vitest';
import { LocateUser } from '@application/location/locate-user.use-case';
import { Coordinates } from '@domain/geo/coordinates';
import { PILOT_CITY_CENTER } from '@domain/geo/pilot-city';
import { FakeGeolocation } from '@infrastructure/in-memory/fake-geolocation';

describe('LocateUser', () => {
  it('renvoie la position de l’appareil quand elle est disponible', async () => {
    const position = Coordinates.fromSnapshot({ latitude: 49.24, longitude: 4.05 });

    const location = await new LocateUser(FakeGeolocation.at(position)).execute();

    expect(location).toEqual({ source: 'device', position });
  });

  it.each(['denied', 'unavailable', 'timeout', 'unsupported'] as const)(
    'se replie sur Reims si la localisation est « %s »',
    async (reason) => {
      const location = await new LocateUser(FakeGeolocation.failing(reason)).execute();

      expect(location).toEqual({ source: 'fallback', position: PILOT_CITY_CENTER, reason });
    },
  );
});
