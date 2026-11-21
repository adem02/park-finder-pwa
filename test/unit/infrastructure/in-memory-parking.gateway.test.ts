import { describe, expect, it } from 'vitest';
import { Coordinates } from '@domain/geo/coordinates';
import { SearchRadius } from '@domain/geo/search-radius';
import { InMemoryParkingGateway } from '@infrastructure/in-memory/in-memory-parking.gateway';
import { createReimsDemoParkings } from '@infrastructure/in-memory/reims-demo-parkings';
import { PILOT_CITY_CENTER } from '@domain/geo/pilot-city';
import { NOW, aParking } from '../../support/parking.builder';

const at = (latitude: number, longitude: number) => Coordinates.fromSnapshot({ latitude, longitude });

const radius = (meters: number) => {
  const result = SearchRadius.create(meters);
  if (!result.ok) throw result.error;
  return result.value;
};

describe('InMemoryParkingGateway', () => {
  const center = at(49.25, 4.03);
  const near = aParking({ id: 'near', coordinates: at(49.2505, 4.03) });
  const middle = aParking({ id: 'middle', coordinates: at(49.253, 4.03) });
  const far = aParking({ id: 'far', coordinates: at(49.3, 4.03) });

  it('ne garde que les parkings dans le rayon, du plus proche au plus loin', async () => {
    const gateway = new InMemoryParkingGateway([far, middle, near]);

    const result = await gateway.findNearby({ center, radius: radius(500) });

    expect(result.ok && result.value.map((p) => p.id)).toEqual(['near', 'middle']);
  });

  it('calcule la distance depuis le centre de recherche', async () => {
    const gateway = new InMemoryParkingGateway([near]);

    const result = await gateway.findNearby({ center, radius: radius(500) });

    expect(result.ok && Math.round(result.value[0]?.distanceMeters ?? 0)).toBe(56);
  });

  it('respecte le nombre max de résultats du rayon', async () => {
    const many = Array.from({ length: 30 }, (_, index) =>
      aParking({ id: `p-${index}`, coordinates: at(49.25 + index * 0.0001, 4.03) }),
    );

    const result = await new InMemoryParkingGateway(many).findNearby({ center, radius: radius(500) });

    expect(result.ok && result.value).toHaveLength(10);
  });

  it('trouve des parkings de démo autour du centre de Reims', async () => {
    const gateway = new InMemoryParkingGateway(createReimsDemoParkings(NOW));

    const result = await gateway.findNearby({ center: PILOT_CITY_CENTER, radius: SearchRadius.DEFAULT });

    expect(result.ok && result.value.length).toBeGreaterThan(0);
  });
});
