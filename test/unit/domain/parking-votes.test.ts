import { describe, expect, it } from 'vitest';
import { ParkingVotes, type VoteType } from '@domain/vote/parking-votes';

describe('ParkingVotes.toggle', () => {
  it.each<[VoteType | null, VoteType, { up: number; down: number; userVote: VoteType | null; intent: string }]>([
    [null, 'UPVOTE', { up: 6, down: 2, userVote: 'UPVOTE', intent: 'vote:UPVOTE' }],
    [null, 'DOWNVOTE', { up: 5, down: 3, userVote: 'DOWNVOTE', intent: 'vote:DOWNVOTE' }],
    ['UPVOTE', 'UPVOTE', { up: 4, down: 2, userVote: null, intent: 'cancel' }],
    ['UPVOTE', 'DOWNVOTE', { up: 4, down: 3, userVote: 'DOWNVOTE', intent: 'vote:DOWNVOTE' }],
    ['DOWNVOTE', 'DOWNVOTE', { up: 5, down: 1, userVote: null, intent: 'cancel' }],
    ['DOWNVOTE', 'UPVOTE', { up: 6, down: 1, userVote: 'UPVOTE', intent: 'vote:UPVOTE' }],
  ])('vote actuel %s + toucher %s', (current, touched, expected) => {
    // 5 pour, 2 contre, vote de l'utilisateur inclus dans ces totaux.
    const votes = ParkingVotes.of(5, 2, current);

    const { votes: next, intent } = votes.toggle(touched);

    expect({ up: next.upvotes, down: next.downvotes, userVote: next.userVote }).toEqual({
      up: expected.up,
      down: expected.down,
      userVote: expected.userVote,
    });
    expect(intent.kind === 'cancel' ? 'cancel' : `vote:${intent.type}`).toBe(expected.intent);
  });

  it('ne modifie pas les votes d’origine', () => {
    const votes = ParkingVotes.of(1, 0, null);

    votes.toggle('UPVOTE');

    expect(votes.upvotes).toBe(1);
    expect(votes.userVote).toBeNull();
  });

  it('expose le score (vérifié au-delà de 10)', () => {
    expect(ParkingVotes.of(11, 0, null).score.isVerified()).toBe(true);
  });
});
