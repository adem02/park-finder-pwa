import { describe, expect, it } from 'vitest';
import { ConflictError, NotFoundError } from '@application/errors/gateway.errors';
import { CommentContent } from '@domain/comment/comment-content';
import { UniversalDirections } from '@infrastructure/browser/universal-directions';
import { InMemoryCommentGateway } from '@infrastructure/in-memory/in-memory-comment.gateway';
import { DEMO_USER, InMemoryParkingStore } from '@infrastructure/in-memory/in-memory-parking.store';
import { InMemoryVoteGateway } from '@infrastructure/in-memory/in-memory-vote.gateway';
import { FixedClock } from '@infrastructure/time/system-clock';
import { ERLON, NOW, aComment, aRecord } from '../../support/parking.builder';

describe('InMemoryVoteGateway', () => {
  it('vote, change de vote puis annule, comme l’API', async () => {
    const store = new InMemoryParkingStore([aRecord({ id: 'p1', upvotes: 3, downvotes: 1 })]);
    const gateway = new InMemoryVoteGateway(store);

    await gateway.vote('p1', 'UPVOTE');
    expect(store.find('p1')).toMatchObject({ upvotes: 4, downvotes: 1, userVote: 'UPVOTE' });

    await gateway.vote('p1', 'DOWNVOTE');
    expect(store.find('p1')).toMatchObject({ upvotes: 3, downvotes: 2, userVote: 'DOWNVOTE' });

    await gateway.cancelVote('p1');
    expect(store.find('p1')).toMatchObject({ upvotes: 3, downvotes: 1, userVote: null });
  });

  it('refuse un second vote identique (409)', async () => {
    const store = new InMemoryParkingStore([aRecord({ id: 'p1', userVote: 'UPVOTE', upvotes: 1 })]);

    const result = await new InMemoryVoteGateway(store).vote('p1', 'UPVOTE');

    expect(!result.ok && result.error).toBeInstanceOf(ConflictError);
  });

  it('refuse d’annuler un vote inexistant (404)', async () => {
    const store = new InMemoryParkingStore([aRecord({ id: 'p1' })]);

    const result = await new InMemoryVoteGateway(store).cancelVote('p1');

    expect(!result.ok && result.error).toBeInstanceOf(NotFoundError);
  });
});

describe('InMemoryCommentGateway', () => {
  const clock = new FixedClock(NOW);

  it('pagine du plus récent au plus ancien', async () => {
    const comments = Array.from({ length: 5 }, (_, n) => aComment({ id: `c${n}` }));
    const store = new InMemoryParkingStore([aRecord({ id: 'p1', comments })]);
    const gateway = new InMemoryCommentGateway(store, clock, DEMO_USER, 2);

    const first = await gateway.list('p1', null);
    const second = await gateway.list('p1', first.ok ? first.value.nextCursor : null);
    const last = await gateway.list('p1', second.ok ? second.value.nextCursor : null);

    expect(first.ok && first.value.items.map((c) => c.id)).toEqual(['c0', 'c1']);
    expect(second.ok && second.value.items.map((c) => c.id)).toEqual(['c2', 'c3']);
    expect(last.ok && last.value).toMatchObject({ nextCursor: null });
    expect(last.ok && last.value.items.map((c) => c.id)).toEqual(['c4']);
  });

  it('publie en tête de liste, signé par l’utilisateur de la démo', async () => {
    const store = new InMemoryParkingStore([aRecord({ id: 'p1', comments: [aComment({ id: 'old' })] })]);
    const gateway = new InMemoryCommentGateway(store, clock);
    const content = CommentContent.create('Nouveau commentaire');
    if (!content.ok) throw content.error;

    await gateway.post('p1', content.value);

    const [newest] = store.find('p1')?.comments ?? [];
    expect(newest?.content).toBe('Nouveau commentaire');
    expect(newest?.author.username).toBe('Vous');
    expect(newest?.createdAt).toEqual(NOW);
  });
});

describe('UniversalDirections', () => {
  it('propose Google Maps et Waze, avec les coordonnées de la destination', () => {
    const links = new UniversalDirections('Mozilla/5.0 (Linux; Android 14)').linksTo(ERLON, 'Erlon');

    expect(links.map((link) => link.app)).toEqual(['google-maps', 'waze']);
    expect(links[0]?.url).toContain('destination=49.2577,4.0287');
    expect(links[1]?.url).toBe('https://waze.com/ul?ll=49.2577,4.0287&navigate=yes');
  });

  it('ajoute Plans en premier sur iPhone', () => {
    const links = new UniversalDirections('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)').linksTo(ERLON, 'Parc Erlon');

    expect(links[0]?.app).toBe('apple-plans');
    expect(links[0]?.url).toContain('q=Parc%20Erlon');
  });
});
