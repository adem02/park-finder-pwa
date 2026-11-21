import {
  Availability,
  type AvailabilityLevel,
  type AvailabilitySnapshot,
} from '../availability/availability';
import { SpotCount, type InvalidReportError } from '../availability/spot-count';
import { Comment, type CommentSnapshot } from '../comment/comment';
import { Coordinates, type CoordinatesSnapshot } from '../geo/coordinates';
import type { Result } from '../shared/result';
import { Author, type AuthorSnapshot } from '../user/author';
import { ParkingVotes, type ParkingVotesSnapshot } from '../vote/parking-votes';
import type { ParkingId } from './parking-summary';
import type { PinState } from './pin-state';

/** Nombre de commentaires montrés sur la page détail (docs/decisions.md). */
export const RECENT_COMMENTS_COUNT = 3;

export interface ParkingDetailsProps {
  readonly id: ParkingId;
  readonly name: string;
  readonly totalSpots: number;
  readonly photos: readonly string[];
  readonly coordinates: Coordinates;
  readonly addedBy: Author;
  readonly availability: Availability;
  readonly votes: ParkingVotes;
  readonly recentComments: readonly Comment[];
  readonly createdAt: Date;
}

export interface ParkingDetailsSnapshot {
  readonly id: ParkingId;
  readonly name: string;
  readonly totalSpots: number;
  readonly photos: readonly string[];
  readonly coordinates: CoordinatesSnapshot;
  readonly addedBy: AuthorSnapshot;
  readonly availability: AvailabilitySnapshot;
  readonly votes: ParkingVotesSnapshot;
  readonly recentComments: readonly CommentSnapshot[];
  readonly createdAt: string;
}

/** Un parking vu en détail : photos, auteur, votes de l'utilisateur, derniers commentaires. */
export class ParkingDetails {
  private constructor(private readonly props: ParkingDetailsProps) {}

  static create(props: ParkingDetailsProps): ParkingDetails {
    return new ParkingDetails(props);
  }

  static fromSnapshot(snapshot: ParkingDetailsSnapshot): ParkingDetails {
    return new ParkingDetails({
      id: snapshot.id,
      name: snapshot.name,
      totalSpots: snapshot.totalSpots,
      photos: snapshot.photos,
      coordinates: Coordinates.fromSnapshot(snapshot.coordinates),
      addedBy: Author.fromSnapshot(snapshot.addedBy),
      availability: Availability.fromSnapshot(snapshot.availability),
      votes: ParkingVotes.fromSnapshot(snapshot.votes),
      recentComments: snapshot.recentComments.map((comment) => Comment.fromSnapshot(comment)),
      createdAt: new Date(snapshot.createdAt),
    });
  }

  get id(): ParkingId {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get totalSpots(): number {
    return this.props.totalSpots;
  }

  get photos(): readonly string[] {
    return this.props.photos;
  }

  get coordinates(): Coordinates {
    return this.props.coordinates;
  }

  get addedBy(): Author {
    return this.props.addedBy;
  }

  get availability(): Availability {
    return this.props.availability;
  }

  get votes(): ParkingVotes {
    return this.props.votes;
  }

  get recentComments(): readonly Comment[] {
    return this.props.recentComments;
  }

  isVerified(): boolean {
    return this.props.votes.score.isVerified();
  }

  availableSpotsAt(now: Date): number | null {
    return this.props.availability.spotsAt(now);
  }

  availabilityLevel(now: Date): AvailabilityLevel {
    return this.props.availability.level(this.props.totalSpots, now);
  }

  pinState(now: Date): PinState {
    return this.props.availability.pinState(now);
  }

  validateReportedSpots(spots: number): Result<SpotCount, InvalidReportError> {
    return SpotCount.create(spots, this.props.totalSpots);
  }

  withVotes(votes: ParkingVotes): ParkingDetails {
    return new ParkingDetails({ ...this.props, votes });
  }

  withReport(spots: SpotCount, reportedAt: Date): ParkingDetails {
    return new ParkingDetails({
      ...this.props,
      availability: Availability.reported(spots.value, reportedAt),
    });
  }

  toSnapshot(): ParkingDetailsSnapshot {
    const { props } = this;
    return {
      id: props.id,
      name: props.name,
      totalSpots: props.totalSpots,
      photos: props.photos,
      coordinates: props.coordinates.toSnapshot(),
      addedBy: props.addedBy.toSnapshot(),
      availability: props.availability.toSnapshot(),
      votes: props.votes.toSnapshot(),
      recentComments: props.recentComments.map((comment) => comment.toSnapshot()),
      createdAt: props.createdAt.toISOString(),
    };
  }
}
