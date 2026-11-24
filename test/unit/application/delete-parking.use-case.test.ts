import { describe, expect, it, vi } from 'vitest';
import { API_ERROR_CODES } from '@application/auth/auth.errors';
import { ConflictError, NetworkError } from '@application/errors/gateway.errors';
import {
  DeleteParking,
  ParkingHasContributionsError,
} from '@application/parking/delete-parking.use-case';
import type { ParkingGateway } from '@application/ports/parking.gateway';
import { err, ok } from '@domain/shared/result';

const gatewayReturning = (result: Awaited<ReturnType<ParkingGateway['delete']>>) => {
  const remove = vi.fn<ParkingGateway['delete']>().mockResolvedValue(result);
  return { gateway: { delete: remove } as unknown as ParkingGateway, remove };
};

describe('DeleteParking', () => {
  it('supprime le parking', async () => {
    const { gateway, remove } = gatewayReturning(ok(undefined));

    const result = await new DeleteParking(gateway).execute('p1');

    expect(result.ok).toBe(true);
    expect(remove).toHaveBeenCalledWith('p1');
  });

  it('traduit le refus « d’autres y ont contribué » de l’API', async () => {
    const { gateway } = gatewayReturning(
      err(new ConflictError('Other users have contributed', API_ERROR_CODES.parkingHasContributions)),
    );

    const result = await new DeleteParking(gateway).execute('p1');

    expect(!result.ok && result.error).toBeInstanceOf(ParkingHasContributionsError);
  });

  it('laisse passer les autres erreurs', async () => {
    const { gateway } = gatewayReturning(err(new NetworkError('offline')));

    const result = await new DeleteParking(gateway).execute('p1');

    expect(!result.ok && result.error).toBeInstanceOf(NetworkError);
  });
});
