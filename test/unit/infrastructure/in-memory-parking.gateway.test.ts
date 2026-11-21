import { describe, expect, it } from 'vitest';
import { Coordinates } from '@domain/geo/coordinates';
import { Availability } from '@domain/availability/availability';
import { ParkingScore } from '@domain/vote/parking-score';
import { SpotCount } from '@domain/availability/spot-count';
import { NotFoundError } from '@application/errors/gateway.errors';
import { InMemoryParkingGateway } from '@infrastructure/in-memory/in-memory-parking.gateway';
import { InMemoryParkingStore } from '@infrastructure/in-memory/in-memory-parking.store';
import {
  REIMS_DEMO_POSITION,
  createReimsDemoStore,
} from '@infrastructure/in-memory/reims-demo-parkings';
import { FixedClock } from '@infrastructure/time/system-clock';
import { NOW, aComment, aParking, aRecord, filtersWith, minutesAgo } from '../../support/parking.builder';

const clock = new FixedClock(NOW);
const gatewayWith = (parkings: Parameters<typeof InMemoryParkingStore.fromSummaries>[0]) =>
  new InMemoryParkingGateway(InMemoryParkingStore.fromSummaries(parkings), clock);

const at = (latitude: number, longitude: number) => Coordinates.fromSnapshot({ latitude, longitude });


describe('InMemoryParkingGateway', () => {
  const center = at(49.25, 4.03);
  const near = aParking({ id: 'near', coordinates: at(49.2505, 4.03) });
  const middle = aParking({ id: 'middle', coordinates: at(49.253, 4.03) });
  const far = aParking({ id: 'far', coordinates: at(49.3, 4.03) });

  it('ne garde que les parkings dans le rayon, du plus proche au plus loin', async () => {
    const gateway = gatewayWith([far, middle, near]);

    const result = await gateway.findNearby({ center, filters: filtersWith({ radiusMeters: 500 }) });

    expect(result.ok && result.value.map((p) => p.id)).toEqual(['near', 'middle']);
  });

  it('calcule la distance depuis le centre de recherche', async () => {
    const gateway = gatewayWith([near]);

    const result = await gateway.findNearby({ center, filters: filtersWith({ radiusMeters: 500 }) });

    expect(result.ok && Math.round(result.value[0]?.distanceMeters ?? 0)).toBe(56);
  });

  it('respecte le nombre max de résultats du rayon', async () => {
    const many = Array.from({ length: 30 }, (_, index) =>
      aParking({ id: `p-${index}`, coordinates: at(49.25 + index * 0.0001, 4.03) }),
    );

    const result = await gatewayWith(many).findNearby({ center, filters: filtersWith({ radiusMeters: 500 }) });

    expect(result.ok && result.value).toHaveLength(10);
  });

  it('filtre parmi les plus proches, puis trie, comme l’API', async () => {
    const small = aParking({ id: 'small', totalSpots: 4, coordinates: at(49.2501, 4.03) });
    const unknown = aParking({ id: 'unknown', totalSpots: 40, coordinates: at(49.2502, 4.03) });
    const free = aParking({
      id: 'free',
      totalSpots: 40,
      coordinates: at(49.2503, 4.03),
      availability: Availability.reported(6, minutesAgo(2)),
    });
    const popular = aParking({
      id: 'popular',
      totalSpots: 40,
      coordinates: at(49.2504, 4.03),
      availability: Availability.reported(3, minutesAgo(5)),
      score: ParkingScore.of(20, 1),
    });
    const gateway = gatewayWith([popular, small, free, unknown]);

    const result = await gateway.findNearby({
      center,
      filters: filtersWith({ radiusMeters: 500, minSpots: 5, availableOnly: true, sort: 'popularity' }),
    });

    expect(result.ok && result.value.map((p) => p.id)).toEqual(['popular', 'free']);
  });

  it('trouve des parkings de démo autour du centre de Reims', async () => {
    const gateway = new InMemoryParkingGateway(createReimsDemoStore(NOW), clock);

    const result = await gateway.findNearby({ center: REIMS_DEMO_POSITION, filters: filtersWith() });

    expect(result.ok && result.value.length).toBeGreaterThan(0);
  });

  it('renvoie le détail d’un parking avec ses 3 derniers commentaires', async () => {
    const comments = [1, 2, 3, 4].map((n) => aComment({ id: `c${n}` }));
    const store = new InMemoryParkingStore([aRecord({ id: 'p1', comments, upvotes: 12 })]);

    const result = await new InMemoryParkingGateway(store, clock).getDetails('p1');

    expect(result.ok && result.value.recentComments.map((c) => c.id)).toEqual(['c1', 'c2', 'c3']);
    expect(result.ok && result.value.isVerified()).toBe(true);
  });

  it('renvoie NotFoundError pour un parking inconnu', async () => {
    const result = await gatewayWith([]).getDetails('inconnu');

    expect(!result.ok && result.error).toBeInstanceOf(NotFoundError);
  });

  it('enregistre un signalement à l’heure de l’horloge', async () => {
    const store = new InMemoryParkingStore([aRecord({ id: 'p1', availability: Availability.none() })]);
    const gateway = new InMemoryParkingGateway(store, clock);
    const spots = SpotCount.create(0, 30);
    if (!spots.ok) throw spots.error;

    await gateway.reportAvailability('p1', spots.value);

    expect(store.find('p1')?.availability.pinState(NOW)).toBe('full');
  });
});
