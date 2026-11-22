import type { Availability } from '@domain/availability/availability';
import type { Comment } from '@domain/comment/comment';
import type { Coordinates } from '@domain/geo/coordinates';
import { ParkingDetails, RECENT_COMMENTS_COUNT } from '@domain/parking/parking-details';
import { ParkingSummary, type ParkingId } from '@domain/parking/parking-summary';
import { Author } from '@domain/user/author';
import { ParkingScore } from '@domain/vote/parking-score';
import { ParkingVotes, type VoteType } from '@domain/vote/parking-votes';

/** L'utilisateur de la démo : auteur des votes, signalements et commentaires faits dans l'app. */
export const DEMO_USER = Author.fromSnapshot({ id: 'demo-user', username: 'Vous', photoUrl: null });

export interface DemoParkingRecord {
  readonly id: ParkingId;
  readonly name: string;
  readonly totalSpots: number;
  readonly photos: readonly string[];
  readonly coordinates: Coordinates;
  readonly addedBy: Author;
  readonly availability: Availability;
  readonly upvotes: number;
  readonly downvotes: number;
  /** Vote de DEMO_USER. */
  readonly userVote: VoteType | null;
  /** Du plus récent au plus ancien. */
  readonly comments: readonly Comment[];
  readonly createdAt: Date;
}

/** État partagé des gateways en mémoire (démo, tests). Seule pièce mutable de l'app. */
export class InMemoryParkingStore {
  private readonly records = new Map<ParkingId, DemoParkingRecord>();
  /** Signalements faits par DEMO_USER (pour son profil). */
  private reports = 0;

  constructor(records: readonly DemoParkingRecord[]) {
    for (const record of records) this.records.set(record.id, record);
  }

  /** Store construit à partir de résumés (tests) : sans auteur réel, commentaire ni vote. */
  static fromSummaries(parkings: readonly ParkingSummary[]): InMemoryParkingStore {
    return new InMemoryParkingStore(
      parkings.map((parking) => ({
        id: parking.id,
        name: parking.name,
        totalSpots: parking.totalSpots,
        photos: parking.coverPhoto ? [parking.coverPhoto] : [],
        coordinates: parking.coordinates,
        addedBy: DEMO_USER,
        availability: parking.availability,
        upvotes: parking.score.upvotes,
        downvotes: parking.score.downvotes,
        userVote: null,
        comments: [],
        createdAt: new Date(0),
      })),
    );
  }

  all(): DemoParkingRecord[] {
    return [...this.records.values()];
  }

  find(id: ParkingId): DemoParkingRecord | undefined {
    return this.records.get(id);
  }

  recordReport(): void {
    this.reports += 1;
  }

  get reportsCount(): number {
    return this.reports;
  }

  insert(record: DemoParkingRecord): void {
    this.records.set(record.id, record);
  }

  update(id: ParkingId, changes: Partial<Omit<DemoParkingRecord, 'id'>>): void {
    const record = this.records.get(id);
    if (record) this.records.set(id, { ...record, ...changes });
  }

  static toSummary(record: DemoParkingRecord, distanceMeters: number): ParkingSummary {
    return ParkingSummary.create({
      id: record.id,
      name: record.name,
      totalSpots: record.totalSpots,
      photos: record.photos,
      coordinates: record.coordinates,
      distanceMeters,
      availability: record.availability,
      score: ParkingScore.of(record.upvotes, record.downvotes),
      createdAt: record.createdAt,
    });
  }

  static toDetails(record: DemoParkingRecord): ParkingDetails {
    return ParkingDetails.create({
      id: record.id,
      name: record.name,
      totalSpots: record.totalSpots,
      photos: record.photos,
      coordinates: record.coordinates,
      addedBy: record.addedBy,
      availability: record.availability,
      votes: ParkingVotes.of(record.upvotes, record.downvotes, record.userVote),
      recentComments: record.comments.slice(0, RECENT_COMMENTS_COUNT),
      createdAt: record.createdAt,
    });
  }
}
