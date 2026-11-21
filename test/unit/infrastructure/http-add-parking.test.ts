import { describe, expect, it, vi } from 'vitest';
import { ConflictError } from '@application/errors/gateway.errors';
import { NewParking } from '@domain/parking/new-parking';
import { FetchHttpClient } from '@infrastructure/http/fetch-http-client';
import { HttpParkingGateway } from '@infrastructure/http/http-parking.gateway';

const BASE = 'https://api.parkfinder.test';

const newParking = () => {
  const result = NewParking.create({
    name: 'Parking de la gare',
    totalSpots: 25,
    latitude: 49.2627,
    longitude: 4.0287,
    photoCount: 1,
  });
  if (!result.ok) throw result.error;
  return result.value;
};

const photo = { blob: new Blob(['jpeg'], { type: 'image/jpeg' }), fileName: 'entree.jpg', previewUrl: 'blob:x' };

const gatewayWith = (fetchFn: typeof fetch) =>
  new HttpParkingGateway(new FetchHttpClient({ baseUrl: BASE, fetchFn, isOnline: () => true }));

describe('HttpParkingGateway.add', () => {
  it('envoie un multipart au format de NewParkingInputDto et rend l’identifiant', async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(JSON.stringify({ id: 'p-new' }), { status: 201 }));

    const result = await gatewayWith(fetchFn).add(newParking(), [photo]);

    expect(result.ok && result.value).toBe('p-new');
    const [url, init] = fetchFn.mock.calls[0] ?? [];
    expect(url).toBe(`${BASE}/parkings/new`);
    expect(init?.method).toBe('POST');
    // Pas de Content-Type manuel : le navigateur pose multipart/form-data avec sa frontière.
    expect(new Headers(init?.headers).get('Content-Type')).toBeNull();
    const form = init?.body as FormData;
    expect(form.get('name')).toBe('Parking de la gare');
    expect(form.get('totalSpots')).toBe('25');
    expect(JSON.parse(form.get('coordinates') as string)).toEqual({ latitude: 49.2627, longitude: 4.0287 });
    expect((form.getAll('photos')[0] as File).name).toBe('entree.jpg');
  });

  it('remonte la 409 « parking déjà existant » avec le code de l’API', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          statusCode: 409,
          message: 'A parking already exists near the provided coordinates.',
          error: 'ParkingAlreadyExistsException',
        }),
        { status: 409 },
      ),
    );

    const result = await gatewayWith(fetchFn).add(newParking(), []);

    expect(!result.ok && result.error).toBeInstanceOf(ConflictError);
    expect(!result.ok && result.error instanceof ConflictError && result.error.code).toBe(
      'ParkingAlreadyExistsException',
    );
  });
});
