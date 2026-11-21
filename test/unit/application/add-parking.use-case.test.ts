import { describe, expect, it, vi } from 'vitest';
import { AddParking, DuplicateParkingError } from '@application/parking/add-parking.use-case';
import { FindNearbyParkings } from '@application/parking/find-nearby-parkings.use-case';
import { NotFoundError } from '@application/errors/gateway.errors';
import type { ParkingGateway } from '@application/ports/parking.gateway';
import { err } from '@domain/shared/result';
import type { PreparedPhoto } from '@application/ports/photo-processor.port';
import { InvalidNewParkingError } from '@domain/parking/new-parking';
import { InMemoryParkingGateway } from '@infrastructure/in-memory/in-memory-parking.gateway';
import { InMemoryParkingStore } from '@infrastructure/in-memory/in-memory-parking.store';
import { FixedClock } from '@infrastructure/time/system-clock';
import { ERLON, NOW, aRecord } from '../../support/parking.builder';

const photo = (name: string): PreparedPhoto => ({
  blob: new Blob(['x'], { type: 'image/jpeg' }),
  fileName: name,
  previewUrl: `blob:test/${name}`,
});

const setup = (records = [aRecord({ id: 'erlon', coordinates: ERLON })]) => {
  const store = new InMemoryParkingStore(records);
  const gateway = new InMemoryParkingGateway(store, new FixedClock(NOW));
  return { store, gateway, addParking: new AddParking(gateway) };
};

/** ~550 m au nord d'Erlon : assez loin pour ne pas être un doublon. */
const elsewhere = { latitude: 49.2627, longitude: 4.0287 };

describe('AddParking', () => {
  it('ajoute le parking, visible ensuite dans la recherche à proximité', async () => {
    const { gateway, addParking } = setup();

    const result = await addParking.execute({
      name: 'Parking de la gare',
      totalSpots: 25,
      ...elsewhere,
      photos: [photo('entree.jpg')],
    });

    expect(result.ok).toBe(true);
    const nearby = await new FindNearbyParkings(gateway).execute({ ...elsewhere, filters: { radiusMeters: 500 } });
    const added = nearby.ok ? nearby.value.find((p) => p.name === 'Parking de la gare') : undefined;
    expect(added?.totalSpots).toBe(25);
    expect(added?.coverPhoto).toBe('blob:test/entree.jpg');
  });

  it('traduit le refus « doublon à moins de 50 m » en DuplicateParkingError', async () => {
    const { addParking } = setup();

    const result = await addParking.execute({
      name: 'Encore Erlon',
      totalSpots: 10,
      latitude: ERLON.latitude + 0.0002,
      longitude: ERLON.longitude,
      photos: [],
    });

    expect(!result.ok && result.error).toBeInstanceOf(DuplicateParkingError);
  });

  it('comprend encore la 404 des versions de l’API antérieures à la 409', async () => {
    const gateway = { add: vi.fn<ParkingGateway['add']>().mockResolvedValue(err(new NotFoundError())) };

    const result = await new AddParking(gateway as unknown as ParkingGateway).execute({
      name: 'Parking de la gare',
      totalSpots: 25,
      ...elsewhere,
      photos: [],
    });

    expect(!result.ok && result.error).toBeInstanceOf(DuplicateParkingError);
  });

  it('n’appelle pas le serveur si les informations sont invalides', async () => {
    const add = vi.fn<ParkingGateway['add']>();
    const gateway = { add } as unknown as ParkingGateway;

    const result = await new AddParking(gateway).execute({
      name: 'ab',
      totalSpots: 10,
      ...elsewhere,
      photos: [photo('1.jpg'), photo('2.jpg'), photo('3.jpg'), photo('4.jpg')],
    });

    expect(!result.ok && result.error).toBeInstanceOf(InvalidNewParkingError);
    expect(add).not.toHaveBeenCalled();
  });
});
