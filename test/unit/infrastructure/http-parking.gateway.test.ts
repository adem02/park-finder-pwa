import { describe, expect, it, vi } from 'vitest';
import {
  InvalidResponseError,
  NetworkError,
  ServerError,
  UnauthorizedError,
} from '@application/errors/gateway.errors';
import { Coordinates } from '@domain/geo/coordinates';
import { SearchRadius } from '@domain/geo/search-radius';
import { FetchHttpClient } from '@infrastructure/http/fetch-http-client';
import { HttpParkingGateway } from '@infrastructure/http/http-parking.gateway';
import { NOW, minutesAgo } from '../../support/parking.builder';

/** Réponse au format exact de FindNearbyParkingsOutputDto (park-finder-api). */
const apiParking = {
  id: '6c1f0b7e-1d2a-4c55-9a52-3c8f1e2d9b10',
  name: 'Parking Saint-Remi',
  totalSpots: 40,
  photos: ['https://res.cloudinary.com/demo/saint-remi.jpg'],
  coordinates: { latitude: 49.2425, longitude: 4.0436 },
  distanceMeters: 812.4,
  availability: { availableSpots: 0, reportedAt: minutesAgo(4).toISOString(), isRecent: true },
  votes: { upvotes: 15, downvotes: 2, score: 13 },
  verified: true,
  createdAt: '2026-08-01T10:00:00.000Z',
};

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const createGateway = (fetchFn: typeof fetch, token: string | null = null) =>
  new HttpParkingGateway(
    new FetchHttpClient({
      baseUrl: 'https://api.parkfinder.test',
      fetchFn,
      getAccessToken: () => token,
      isOnline: () => true,
    }),
  );

const query = {
  center: Coordinates.fromSnapshot({ latitude: 49.25, longitude: 4.03 }),
  radius: SearchRadius.DEFAULT,
};

describe('HttpParkingGateway.findNearby', () => {
  it('appelle GET /parkings avec lat, lng et radius', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ parkings: [] }));

    await createGateway(fetchFn).findNearby(query);

    const [url, init] = fetchFn.mock.calls[0] ?? [];
    expect(url).toBe('https://api.parkfinder.test/parkings?lat=49.25&lng=4.03&radius=2000');
    expect(init?.method).toBe('GET');
  });

  it('envoie le token d’accès quand il existe', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ parkings: [] }));

    await createGateway(fetchFn, 'jwt-123').findNearby(query);

    const headers = new Headers(fetchFn.mock.calls[0]?.[1]?.headers);
    expect(headers.get('Authorization')).toBe('Bearer jwt-123');
  });

  it('convertit la réponse de l’API en entités du domaine', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ parkings: [apiParking] }));

    const result = await createGateway(fetchFn).findNearby(query);

    expect(result.ok).toBe(true);
    const [parking] = result.ok ? result.value : [];
    expect(parking?.name).toBe('Parking Saint-Remi');
    expect(parking?.distanceMeters).toBe(812.4);
    expect(parking?.pinState(NOW)).toBe('full');
    expect(parking?.isVerified()).toBe(true);
    expect(parking?.coverPhoto).toBe('https://res.cloudinary.com/demo/saint-remi.jpg');
  });

  it('traite une dispo absente (null) comme « pas d’info »', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        parkings: [{ ...apiParking, availability: { availableSpots: null, reportedAt: null, isRecent: false } }],
      }),
    );

    const result = await createGateway(fetchFn).findNearby(query);

    expect(result.ok && result.value[0]?.pinState(NOW)).toBe('unknown');
  });

  it('renvoie UnauthorizedError sur un 401', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ message: 'Unauthorized' }, 401));

    const result = await createGateway(fetchFn).findNearby(query);

    expect(!result.ok && result.error).toBeInstanceOf(UnauthorizedError);
  });

  it('renvoie ServerError sur un 500', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({}, 500));

    const result = await createGateway(fetchFn).findNearby(query);

    expect(!result.ok && result.error).toBeInstanceOf(ServerError);
  });

  it('renvoie InvalidResponseError si le format ne correspond pas', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ items: [] }));

    const result = await createGateway(fetchFn).findNearby(query);

    expect(!result.ok && result.error).toBeInstanceOf(InvalidResponseError);
  });

  it('renvoie NetworkError quand le serveur est injoignable', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Failed to fetch'));

    const result = await createGateway(fetchFn).findNearby(query);

    expect(!result.ok && result.error).toBeInstanceOf(NetworkError);
  });

  it('laisse remonter une annulation volontaire', async () => {
    const controller = new AbortController();
    const fetchFn = vi.fn<typeof fetch>().mockImplementation(() => {
      controller.abort();
      return Promise.reject(new DOMException('Aborted', 'AbortError'));
    });

    await expect(createGateway(fetchFn).findNearby(query, controller.signal)).rejects.toThrow('Aborted');
  });
});
