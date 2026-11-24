import { describe, expect, it, vi } from 'vitest';
import { ReportAvailability } from '@application/availability/report-availability.use-case';
import { PostComment } from '@application/comment/post-comment.use-case';
import { ConflictError, NetworkError } from '@application/errors/gateway.errors';
import type { CommentGateway } from '@application/ports/comment.gateway';
import type { ParkingGateway } from '@application/ports/parking.gateway';
import type { VoteGateway } from '@application/ports/vote.gateway';
import { ToggleVote } from '@application/vote/toggle-vote.use-case';
import { InvalidReportError } from '@domain/availability/spot-count';
import { InvalidCommentContentError } from '@domain/comment/comment-content';
import { err, ok } from '@domain/shared/result';
import { ParkingVotes } from '@domain/vote/parking-votes';
import { FixedClock } from '@infrastructure/time/system-clock';
import { NOW, someParkingDetails } from '../../support/parking.builder';

const voteGateway = () => {
  const gateway = {
    vote: vi.fn<VoteGateway['vote']>().mockResolvedValue(ok(undefined)),
    cancelVote: vi.fn<VoteGateway['cancelVote']>().mockResolvedValue(ok(undefined)),
  };
  return gateway satisfies VoteGateway;
};

describe('ToggleVote', () => {
  it('vote quand l’utilisateur n’a pas encore voté', async () => {
    const gateway = voteGateway();
    const parking = someParkingDetails({ votes: ParkingVotes.of(2, 0, null) });

    const result = await new ToggleVote(gateway).execute({ parking, type: 'UPVOTE' });

    expect(gateway.vote).toHaveBeenCalledWith('parking-1', 'UPVOTE');
    expect(result.ok && result.value.upvotes).toBe(3);
  });

  it('annule quand il touche le même bouton', async () => {
    const gateway = voteGateway();
    const parking = someParkingDetails({ votes: ParkingVotes.of(2, 0, 'UPVOTE') });

    await new ToggleVote(gateway).execute({ parking, type: 'UPVOTE' });

    expect(gateway.cancelVote).toHaveBeenCalledWith('parking-1');
    expect(gateway.vote).not.toHaveBeenCalled();
  });

  it('change de vote quand il touche l’autre bouton', async () => {
    const gateway = voteGateway();
    const parking = someParkingDetails({ votes: ParkingVotes.of(2, 0, 'UPVOTE') });

    await new ToggleVote(gateway).execute({ parking, type: 'DOWNVOTE' });

    expect(gateway.vote).toHaveBeenCalledWith('parking-1', 'DOWNVOTE');
  });

  it('remonte l’erreur du serveur', async () => {
    const gateway = voteGateway();
    gateway.vote.mockResolvedValue(err(new ConflictError('vote déjà enregistré')));

    const result = await new ToggleVote(gateway).execute({
      parking: someParkingDetails(),
      type: 'UPVOTE',
    });

    expect(!result.ok && result.error).toBeInstanceOf(ConflictError);
  });

  it('preview donne le résultat attendu sans appeler le serveur', () => {
    const gateway = voteGateway();
    const parking = someParkingDetails({ votes: ParkingVotes.of(2, 1, 'DOWNVOTE') });

    const preview = new ToggleVote(gateway).preview(parking, 'UPVOTE');

    expect(preview.toSnapshot()).toEqual({ upvotes: 3, downvotes: 0, userVote: 'UPVOTE' });
    expect(gateway.vote).not.toHaveBeenCalled();
  });
});

describe('ReportAvailability', () => {
  const parkingGateway = () => ({
    findNearby: vi.fn<ParkingGateway['findNearby']>(),
    getDetails: vi.fn<ParkingGateway['getDetails']>(),
    reportAvailability: vi.fn<ParkingGateway['reportAvailability']>().mockResolvedValue(ok(undefined)),
    add: vi.fn<ParkingGateway['add']>(),
    delete: vi.fn<ParkingGateway['delete']>(),
    addPhotos: vi.fn<ParkingGateway['addPhotos']>(),
    removePhoto: vi.fn<ParkingGateway['removePhoto']>(),
  });

  it('envoie le signalement et renvoie le parking à jour, horodaté par l’horloge', async () => {
    const gateway = parkingGateway();

    const result = await new ReportAvailability(gateway, new FixedClock(NOW)).execute({
      parking: someParkingDetails({ totalSpots: 30 }),
      spots: 0,
    });

    expect(gateway.reportAvailability).toHaveBeenCalledWith('parking-1', expect.objectContaining({ value: 0 }));
    expect(result.ok && result.value.pinState(NOW)).toBe('full');
    expect(result.ok && result.value.availability.reportedAt).toEqual(NOW);
  });

  it('refuse un nombre de places hors limites sans appeler le serveur', async () => {
    const gateway = parkingGateway();

    const result = await new ReportAvailability(gateway, new FixedClock(NOW)).execute({
      parking: someParkingDetails({ totalSpots: 30 }),
      spots: 31,
    });

    expect(!result.ok && result.error).toBeInstanceOf(InvalidReportError);
    expect(gateway.reportAvailability).not.toHaveBeenCalled();
  });

  it('remonte une erreur réseau', async () => {
    const gateway = parkingGateway();
    gateway.reportAvailability.mockResolvedValue(err(new NetworkError('offline')));

    const result = await new ReportAvailability(gateway, new FixedClock(NOW)).execute({
      parking: someParkingDetails(),
      spots: 3,
    });

    expect(!result.ok && result.error).toBeInstanceOf(NetworkError);
  });
});

describe('PostComment', () => {
  const commentGateway = () => ({
    list: vi.fn<CommentGateway['list']>(),
    post: vi.fn<CommentGateway['post']>().mockResolvedValue(ok(undefined)),
  });

  it('publie le texte nettoyé', async () => {
    const gateway = commentGateway();

    await new PostComment(gateway).execute({ parkingId: 'p1', content: '  Très pratique  ' });

    expect(gateway.post).toHaveBeenCalledWith('p1', expect.objectContaining({ value: 'Très pratique' }));
  });

  it('refuse un commentaire vide sans appeler le serveur', async () => {
    const gateway = commentGateway();

    const result = await new PostComment(gateway).execute({ parkingId: 'p1', content: ' ' });

    expect(!result.ok && result.error).toBeInstanceOf(InvalidCommentContentError);
    expect(gateway.post).not.toHaveBeenCalled();
  });
});
