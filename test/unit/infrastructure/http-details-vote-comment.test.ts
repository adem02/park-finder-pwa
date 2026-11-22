import { describe, expect, it, vi } from 'vitest';
import {
  BadRequestError,
  ConflictError,
  InvalidResponseError,
  NotFoundError,
} from '@application/errors/gateway.errors';
import { SpotCount } from '@domain/availability/spot-count';
import { CommentContent } from '@domain/comment/comment-content';
import { FetchHttpClient } from '@infrastructure/http/fetch-http-client';
import { HttpCommentGateway } from '@infrastructure/http/http-comment.gateway';
import { HttpParkingGateway } from '@infrastructure/http/http-parking.gateway';
import { HttpVoteGateway } from '@infrastructure/http/http-vote.gateway';
import { NOW, minutesAgo } from '../../support/parking.builder';

const BASE = 'https://api.parkfinder.test';

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const emptyResponse = (status = 201): Response => new Response(null, { status });

const clientWith = (fetchFn: typeof fetch) =>
  new FetchHttpClient({ baseUrl: BASE, fetchFn, isOnline: () => true });

/** Réponse au format exact de GetParkingDetailsOutputDTO (park-finder-api). */
const apiDetails = {
  id: 'p-42',
  name: 'Parking Saint-Remi',
  totalSpots: 40,
  photos: ['https://res.cloudinary.com/demo/saint-remi.jpg'],
  coordinates: { latitude: 49.2425, longitude: 4.0436 },
  addedBy: { id: 'u1', username: 'camille_r' },
  availability: { availableSpots: 12, reportedAt: minutesAgo(3).toISOString(), isRecent: true },
  votes: { upvotes: 14, downvotes: 2, userVote: 'UPVOTE' },
  recentComments: [
    {
      id: 'c1',
      content: 'Souvent des places le matin.',
      author: { id: 'u2', username: 'theo51', photoUrl: 'https://res.cloudinary.com/demo/theo.jpg' },
      createdAt: minutesAgo(60).toISOString(),
    },
  ],
  createdAt: '2026-08-01T10:00:00.000Z',
};

const spotsOf = (value: number) => {
  const spots = SpotCount.create(value, 40);
  if (!spots.ok) throw spots.error;
  return spots.value;
};

describe('HttpParkingGateway.getDetails', () => {
  it('appelle GET /parkings/:id et convertit la réponse en entité', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse(apiDetails));

    const result = await new HttpParkingGateway(clientWith(fetchFn)).getDetails('p-42');

    expect(fetchFn.mock.calls[0]?.[0]).toBe(`${BASE}/parkings/p-42`);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const parking = result.value;
    expect(parking.name).toBe('Parking Saint-Remi');
    expect(parking.addedBy.username).toBe('camille_r');
    expect(parking.addedBy.photoUrl).toBeNull();
    expect(parking.votes.userVote).toBe('UPVOTE');
    expect(parking.isVerified()).toBe(true);
    expect(parking.availableSpotsAt(NOW)).toBe(12);
    expect(parking.recentComments[0]?.author.photoUrl).toBe('https://res.cloudinary.com/demo/theo.jpg');
  });

  it('renvoie NotFoundError sur un 404', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ message: 'Not found' }, 404));

    const result = await new HttpParkingGateway(clientWith(fetchFn)).getDetails('inconnu');

    expect(!result.ok && result.error).toBeInstanceOf(NotFoundError);
  });

  it('renvoie InvalidResponseError si un champ manque', async () => {
    const withoutVotes: Partial<typeof apiDetails> = { ...apiDetails };
    delete withoutVotes.votes;
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse(withoutVotes));

    const result = await new HttpParkingGateway(clientWith(fetchFn)).getDetails('p-42');

    expect(!result.ok && result.error).toBeInstanceOf(InvalidResponseError);
  });
});

describe('HttpParkingGateway.reportAvailability', () => {
  it('envoie POST /parkings/:id/report avec availableSpots, 0 compris', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(emptyResponse());

    const result = await new HttpParkingGateway(clientWith(fetchFn)).reportAvailability('p-42', spotsOf(0));

    const [url, init] = fetchFn.mock.calls[0] ?? [];
    expect(url).toBe(`${BASE}/parkings/p-42/report`);
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe(JSON.stringify({ availableSpots: 0 }));
    expect(result.ok).toBe(true);
  });

  it('remonte le message de validation de l’API sur un 400', async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ statusCode: 400, message: ['availableSpots must not be less than 1'] }, 400));

    const result = await new HttpParkingGateway(clientWith(fetchFn)).reportAvailability('p-42', spotsOf(0));

    expect(!result.ok && result.error).toBeInstanceOf(BadRequestError);
    expect(!result.ok && result.error.kind === 'BadRequest' && result.error.details).toBe(
      'availableSpots must not be less than 1',
    );
  });
});

describe('HttpVoteGateway', () => {
  it('vote avec POST /parkings/:id/vote?type=…', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(emptyResponse());

    await new HttpVoteGateway(clientWith(fetchFn)).vote('p-42', 'DOWNVOTE');

    const [url, init] = fetchFn.mock.calls[0] ?? [];
    expect(url).toBe(`${BASE}/parkings/p-42/vote?type=DOWNVOTE`);
    expect(init?.method).toBe('POST');
    expect(init?.body).toBeUndefined();
  });

  it('annule avec DELETE /parkings/:id/vote', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(emptyResponse(200));

    const result = await new HttpVoteGateway(clientWith(fetchFn)).cancelVote('p-42');

    expect(fetchFn.mock.calls[0]?.[1]?.method).toBe('DELETE');
    expect(result.ok).toBe(true);
  });

  it('renvoie ConflictError sur un 409 (vote déjà enregistré)', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ message: 'Already voted' }, 409));

    const result = await new HttpVoteGateway(clientWith(fetchFn)).vote('p-42', 'UPVOTE');

    expect(!result.ok && result.error).toBeInstanceOf(ConflictError);
  });
});

describe('HttpCommentGateway', () => {
  it('liste une page avec limit et curseur, et renvoie le curseur suivant', async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ items: apiDetails.recentComments, nextCursor: 'abc' }));

    const result = await new HttpCommentGateway(clientWith(fetchFn)).list('p-42', 'xyz');

    expect(fetchFn.mock.calls[0]?.[0]).toBe(`${BASE}/parkings/p-42/comments?limit=20&cursor=xyz`);
    expect(result.ok && result.value.nextCursor).toBe('abc');
    expect(result.ok && result.value.items[0]?.content).toBe('Souvent des places le matin.');
  });

  it('n’envoie pas de curseur pour la première page', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ items: [], nextCursor: null }));

    await new HttpCommentGateway(clientWith(fetchFn)).list('p-42', null);

    expect(fetchFn.mock.calls[0]?.[0]).toBe(`${BASE}/parkings/p-42/comments?limit=20`);
  });

  it('publie avec POST /parkings/:id/comments et { content }', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(emptyResponse());
    const content = CommentContent.create('Bien éclairé');
    if (!content.ok) throw content.error;

    await new HttpCommentGateway(clientWith(fetchFn)).post('p-42', content.value);

    const [url, init] = fetchFn.mock.calls[0] ?? [];
    expect(url).toBe(`${BASE}/parkings/p-42/comments`);
    expect(init?.body).toBe(JSON.stringify({ content: 'Bien éclairé' }));
  });
});
