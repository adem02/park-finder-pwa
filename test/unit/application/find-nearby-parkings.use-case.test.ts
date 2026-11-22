import { describe, expect, it, vi } from 'vitest';
import { NetworkError } from '@application/errors/gateway.errors';
import { FindNearbyParkings } from '@application/parking/find-nearby-parkings.use-case';
import type { ParkingGateway } from '@application/ports/parking.gateway';
import { InvalidCoordinatesError } from '@domain/geo/coordinates';
import { InvalidSearchRadiusError } from '@domain/geo/search-radius';
import { InvalidMinSpotsError } from '@domain/search/parking-filters';
import { err, ok } from '@domain/shared/result';
import { aParking } from '../../support/parking.builder';

const gatewayReturning = (result: Awaited<ReturnType<ParkingGateway['findNearby']>>) => {
  const findNearby = vi.fn<ParkingGateway['findNearby']>().mockResolvedValue(result);
  const gateway: ParkingGateway = {
    findNearby,
    getDetails: vi.fn<ParkingGateway['getDetails']>(),
    reportAvailability: vi.fn<ParkingGateway['reportAvailability']>(),
    add: vi.fn<ParkingGateway['add']>(),
  };
  return { gateway, findNearby };
};

describe('FindNearbyParkings', () => {
  it('cherche autour du centre avec le rayon par défaut (2 km)', async () => {
    const { gateway, findNearby } = gatewayReturning(ok([aParking()]));

    const result = await new FindNearbyParkings(gateway).execute({ latitude: 49.25, longitude: 4.03 });

    expect(result.ok && result.value).toHaveLength(1);
    const [query] = findNearby.mock.calls[0] ?? [];
    expect(query?.center.toSnapshot()).toEqual({ latitude: 49.25, longitude: 4.03 });
    expect(query?.filters.toSnapshot()).toEqual({
      radiusMeters: 2000,
      minSpots: 0,
      availableOnly: false,
      verifiedOnly: false,
      sort: 'distance',
    });
  });

  it('transmet les critères au gateway', async () => {
    const { gateway, findNearby } = gatewayReturning(ok([]));

    await new FindNearbyParkings(gateway).execute({
      latitude: 49.25,
      longitude: 4.03,
      filters: { radiusMeters: 500, verifiedOnly: true, sort: 'recent' },
    });

    const [query] = findNearby.mock.calls[0] ?? [];
    expect(query?.filters).toMatchObject({ minSpots: 0, verifiedOnly: true, sort: 'recent' });
    expect(query?.filters.radius.meters).toBe(500);
  });

  it('refuse un nombre de places minimum négatif sans appeler le gateway', async () => {
    const { gateway, findNearby } = gatewayReturning(ok([]));

    const result = await new FindNearbyParkings(gateway).execute({
      latitude: 49.25,
      longitude: 4.03,
      filters: { minSpots: -1 },
    });

    expect(!result.ok && result.error).toBeInstanceOf(InvalidMinSpotsError);
    expect(findNearby).not.toHaveBeenCalled();
  });

  it('transmet le signal d’annulation au gateway', async () => {
    const { gateway, findNearby } = gatewayReturning(ok([]));
    const controller = new AbortController();

    await new FindNearbyParkings(gateway).execute(
      { latitude: 49.25, longitude: 4.03, filters: { radiusMeters: 500 } },
      controller.signal,
    );

    expect(findNearby).toHaveBeenCalledWith(expect.anything(), controller.signal);
  });

  it('refuse des coordonnées invalides sans appeler le gateway', async () => {
    const { gateway, findNearby } = gatewayReturning(ok([]));

    const result = await new FindNearbyParkings(gateway).execute({ latitude: 120, longitude: 4.03 });

    expect(!result.ok && result.error).toBeInstanceOf(InvalidCoordinatesError);
    expect(findNearby).not.toHaveBeenCalled();
  });

  it('refuse un rayon non autorisé sans appeler le gateway', async () => {
    const { gateway, findNearby } = gatewayReturning(ok([]));

    const result = await new FindNearbyParkings(gateway).execute({
      latitude: 49.25,
      longitude: 4.03,
      filters: { radiusMeters: 750 },
    });

    expect(!result.ok && result.error).toBeInstanceOf(InvalidSearchRadiusError);
    expect(findNearby).not.toHaveBeenCalled();
  });

  it('remonte les erreurs du gateway telles quelles', async () => {
    const { gateway } = gatewayReturning(err(new NetworkError('offline')));

    const result = await new FindNearbyParkings(gateway).execute({ latitude: 49.25, longitude: 4.03 });

    expect(!result.ok && result.error).toBeInstanceOf(NetworkError);
  });
});
