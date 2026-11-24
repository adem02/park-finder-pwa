import { describe, expect, it, vi } from 'vitest';
import { API_ERROR_CODES } from '@application/auth/auth.errors';
import { ConflictError } from '@application/errors/gateway.errors';
import {
  AddParkingPhotos,
  ParkingPhotosFullError,
} from '@application/parking/add-parking-photos.use-case';
import type { ParkingGateway } from '@application/ports/parking.gateway';
import type { PreparedPhoto } from '@application/ports/photo-processor.port';
import { err, ok } from '@domain/shared/result';
import { someParkingDetails } from '../../support/parking.builder';

const prepared = (name: string): PreparedPhoto => ({
  blob: new Blob([name]),
  fileName: `${name}.jpg`,
  previewUrl: `blob:fake/${name}`,
});
const photo = (id: string) => ({ id, url: `https://cdn/${id}.jpg`, isMine: false });

function gateway(result: Awaited<ReturnType<ParkingGateway['addPhotos']>>) {
  const addPhotos = vi.fn<ParkingGateway['addPhotos']>().mockResolvedValue(result);
  return { gateway: { addPhotos } as unknown as ParkingGateway, addPhotos };
}

describe('AddParkingPhotos', () => {
  it('envoie les photos du parking', async () => {
    const { gateway: parkings, addPhotos } = gateway(ok(undefined));
    const parking = someParkingDetails({ photos: [photo('a')] });

    const result = await new AddParkingPhotos(parkings).execute(parking, [prepared('b'), prepared('c')]);

    expect(result.ok).toBe(true);
    expect(addPhotos).toHaveBeenCalledWith(parking.id, [prepared('b'), prepared('c')]);
  });

  it('refuse sans appeler l’API au-delà de 3 photos', async () => {
    const { gateway: parkings, addPhotos } = gateway(ok(undefined));
    const parking = someParkingDetails({ photos: [photo('a'), photo('b')] });

    const result = await new AddParkingPhotos(parkings).execute(parking, [prepared('c'), prepared('d')]);

    expect(!result.ok && result.error).toBeInstanceOf(ParkingPhotosFullError);
    expect(addPhotos).not.toHaveBeenCalled();
  });

  it('traduit le refus de l’API quand quelqu’un a complété entre-temps', async () => {
    const { gateway: parkings } = gateway(
      err(new ConflictError('full', API_ERROR_CODES.parkingPhotosFull)),
    );

    const result = await new AddParkingPhotos(parkings).execute(someParkingDetails({ photos: [] }), [
      prepared('a'),
    ]);

    expect(!result.ok && result.error).toBeInstanceOf(ParkingPhotosFullError);
  });
});
