import { Availability } from '@domain/availability/availability';
import { Comment } from '@domain/comment/comment';
import { Coordinates } from '@domain/geo/coordinates';
import { ParkingDetails, type ParkingDetailsProps } from '@domain/parking/parking-details';
import { ParkingSummary, type ParkingSummaryProps } from '@domain/parking/parking-summary';
import { Author } from '@domain/user/author';
import { ParkingScore } from '@domain/vote/parking-score';
import { ParkingVotes } from '@domain/vote/parking-votes';
import type { DemoParkingRecord } from '@infrastructure/in-memory/in-memory-parking.store';

export const NOW = new Date('2026-11-21T12:00:00Z');

export const minutesAgo = (minutes: number, from: Date = NOW): Date =>
  new Date(from.getTime() - minutes * 60_000);

export const ERLON = Coordinates.fromSnapshot({ latitude: 49.2577, longitude: 4.0287 });

export const anAuthor = (username = 'camille_r'): Author =>
  Author.fromSnapshot({ id: `author-${username}`, username, photoUrl: null });

export const aComment = (overrides: Partial<{ id: string; content: string; author: Author; createdAt: Date }> = {}) =>
  Comment.create({
    id: 'comment-1',
    content: 'Accès facile, bien éclairé le soir.',
    author: anAuthor(),
    createdAt: minutesAgo(30),
    ...overrides,
  });

/** Construit un parking valide ; chaque test ne précise que ce qui compte pour lui. */
export const aParking = (overrides: Partial<ParkingSummaryProps> = {}): ParkingSummary =>
  ParkingSummary.create({
    id: 'parking-1',
    name: 'Parking Erlon',
    totalSpots: 30,
    photos: [],
    coordinates: ERLON,
    distanceMeters: 120,
    availability: Availability.none(),
    score: ParkingScore.of(0, 0),
    createdAt: new Date('2026-07-30T00:00:00Z'),
    ...overrides,
  });

export const someParkingDetails = (overrides: Partial<ParkingDetailsProps> = {}): ParkingDetails =>
  ParkingDetails.create({
    id: 'parking-1',
    name: 'Parking Erlon',
    totalSpots: 30,
    photos: [],
    coordinates: ERLON,
    addedBy: anAuthor(),
    availability: Availability.none(),
    votes: ParkingVotes.of(0, 0, null),
    recentComments: [],
    createdAt: new Date('2026-07-30T00:00:00Z'),
    ...overrides,
  });

export const aRecord = (overrides: Partial<DemoParkingRecord> = {}): DemoParkingRecord => ({
  id: 'parking-1',
  name: 'Parking Erlon',
  totalSpots: 30,
  photos: [],
  coordinates: ERLON,
  addedBy: anAuthor(),
  availability: Availability.none(),
  upvotes: 0,
  downvotes: 0,
  userVote: null,
  comments: [],
  createdAt: new Date('2026-07-30T00:00:00Z'),
  ...overrides,
});
