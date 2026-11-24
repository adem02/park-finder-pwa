import { describe, expect, it } from 'vitest';
import { Availability } from '@domain/availability/availability';
import { SpotCount } from '@domain/availability/spot-count';
import { ParkingDetails } from '@domain/parking/parking-details';
import { ParkingVotes } from '@domain/vote/parking-votes';
import { NOW, aComment, minutesAgo, someParkingDetails } from '../../support/parking.builder';

describe('ParkingDetails', () => {
  it('valide un signalement selon son nombre total de places', () => {
    const parking = someParkingDetails({ totalSpots: 12 });

    expect(parking.validateReportedSpots(12).ok).toBe(true);
    expect(parking.validateReportedSpots(13).ok).toBe(false);
  });

  it('withReport renvoie un parking mis à jour, sans toucher l’original', () => {
    const parking = someParkingDetails();
    const spots = SpotCount.create(0, 30);
    if (!spots.ok) throw spots.error;

    const reported = parking.withReport(spots.value, NOW);

    expect(reported.pinState(NOW)).toBe('full');
    expect(parking.pinState(NOW)).toBe('unknown');
  });

  it('withVotes remplace les votes et recalcule « vérifié »', () => {
    const parking = someParkingDetails({ votes: ParkingVotes.of(10, 0, null) });

    const voted = parking.withVotes(parking.votes.toggle('UPVOTE').votes);

    expect(voted.isVerified()).toBe(true);
    expect(voted.votes.userVote).toBe('UPVOTE');
    expect(parking.isVerified()).toBe(false);
  });

  it('survit à un aller-retour JSON par son snapshot', () => {
    const parking = someParkingDetails({
      photos: [{ id: 'ph-1', url: 'https://res.cloudinary.com/demo/a.jpg', isMine: true }],
      availability: Availability.reported(7, minutesAgo(12)),
      votes: ParkingVotes.of(3, 1, 'DOWNVOTE'),
      recentComments: [aComment()],
    });

    const restored = ParkingDetails.fromSnapshot(
      JSON.parse(JSON.stringify(parking.toSnapshot())) as ReturnType<typeof parking.toSnapshot>,
    );

    expect(restored.toSnapshot()).toEqual(parking.toSnapshot());
    expect(restored.pinState(NOW)).toBe('stale');
    expect(restored.votes.userVote).toBe('DOWNVOTE');
    expect(restored.recentComments[0]?.author.initial).toBe('C');
  });

  it('compte les places restantes pour des photos (3 au plus)', () => {
    const photo = (id: string) => ({ id, url: `https://cdn/${id}.jpg`, isMine: false });

    expect(someParkingDetails({ photos: [] }).remainingPhotoSlots).toBe(3);
    expect(someParkingDetails({ photos: [photo('a'), photo('b')] }).remainingPhotoSlots).toBe(1);
    expect(someParkingDetails({ photos: [photo('a'), photo('b'), photo('c')] }).remainingPhotoSlots).toBe(0);
  });
});
