import {
  Availability,
  type AvailabilityLevel,
  type AvailabilitySnapshot,
} from '../availability/availability';
import { Coordinates, type CoordinatesSnapshot } from '../geo/coordinates';
import { ParkingScore } from '../vote/parking-score';
import type { PinState } from './pin-state';

export type ParkingId = string;

export interface ParkingSummaryProps {
  readonly id: ParkingId;
  readonly name: string;
  readonly totalSpots: number;
  readonly photos: readonly string[];
  readonly coordinates: Coordinates;
  readonly distanceMeters: number;
  readonly availability: Availability;
  readonly score: ParkingScore;
  readonly createdAt: Date;
}

/** Forme sérialisable, stockée dans le cache TanStack Query (et sa persistance hors ligne). */
export interface ParkingSummarySnapshot {
  readonly id: ParkingId;
  readonly name: string;
  readonly totalSpots: number;
  readonly photos: readonly string[];
  readonly coordinates: CoordinatesSnapshot;
  readonly distanceMeters: number;
  readonly availability: AvailabilitySnapshot;
  readonly upvotes: number;
  readonly downvotes: number;
  readonly createdAt: string;
}

/** Un parking tel qu'il apparaît dans une recherche à proximité (carte, liste). */
export class ParkingSummary {
  private constructor(private readonly props: ParkingSummaryProps) {}

  static create(props: ParkingSummaryProps): ParkingSummary {
    return new ParkingSummary(props);
  }

  static fromSnapshot(snapshot: ParkingSummarySnapshot): ParkingSummary {
    return new ParkingSummary({
      id: snapshot.id,
      name: snapshot.name,
      totalSpots: snapshot.totalSpots,
      photos: snapshot.photos,
      coordinates: Coordinates.fromSnapshot(snapshot.coordinates),
      distanceMeters: snapshot.distanceMeters,
      availability: Availability.fromSnapshot(snapshot.availability),
      score: ParkingScore.of(snapshot.upvotes, snapshot.downvotes),
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

  get coordinates(): Coordinates {
    return this.props.coordinates;
  }

  get distanceMeters(): number {
    return this.props.distanceMeters;
  }

  get coverPhoto(): string | null {
    return this.props.photos[0] ?? null;
  }

  get availability(): Availability {
    return this.props.availability;
  }

  get score(): ParkingScore {
    return this.props.score;
  }

  isVerified(): boolean {
    return this.props.score.isVerified();
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

  /** Copie du parking, vu depuis une autre position. */
  withDistance(distanceMeters: number): ParkingSummary {
    return new ParkingSummary({ ...this.props, distanceMeters });
  }

  toSnapshot(): ParkingSummarySnapshot {
    const { props } = this;
    return {
      id: props.id,
      name: props.name,
      totalSpots: props.totalSpots,
      photos: props.photos,
      coordinates: props.coordinates.toSnapshot(),
      distanceMeters: props.distanceMeters,
      availability: props.availability.toSnapshot(),
      upvotes: props.score.upvotes,
      downvotes: props.score.downvotes,
      createdAt: props.createdAt.toISOString(),
    };
  }
}
