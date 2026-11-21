import { Availability } from '@domain/availability/availability';
import { Coordinates } from '@domain/geo/coordinates';
import { ParkingSummary, type ParkingSummaryProps } from '@domain/parking/parking-summary';
import { ParkingScore } from '@domain/vote/parking-score';

export const NOW = new Date('2026-11-21T12:00:00Z');

export const minutesAgo = (minutes: number, from: Date = NOW): Date =>
  new Date(from.getTime() - minutes * 60_000);

/** Construit un parking valide ; chaque test ne précise que ce qui compte pour lui. */
export const aParking = (overrides: Partial<ParkingSummaryProps> = {}): ParkingSummary =>
  ParkingSummary.create({
    id: 'parking-1',
    name: 'Parking Erlon',
    totalSpots: 30,
    photos: [],
    coordinates: Coordinates.fromSnapshot({ latitude: 49.2577, longitude: 4.0287 }),
    distanceMeters: 120,
    availability: Availability.none(),
    score: ParkingScore.of(0, 0),
    createdAt: new Date('2026-07-30T00:00:00Z'),
    ...overrides,
  });
