import { Availability } from '@domain/availability/availability';
import { Coordinates } from '@domain/geo/coordinates';
import { ParkingSummary } from '@domain/parking/parking-summary';
import { ParkingScore } from '@domain/vote/parking-score';
import seed from './reims-demo-parkings.json';

/**
 * Parkings gratuits de Reims issus d'OpenStreetMap (© contributeurs OpenStreetMap, ODbL),
 * générés par `npm run seed:demo`. Les signalements et les votes sont fictifs.
 */
interface DemoParkingSeed {
  readonly id: string;
  readonly name: string;
  readonly totalSpots: number;
  readonly latitude: number;
  readonly longitude: number;
}

const SEED_DATE = new Date('2026-07-30T00:00:00Z');

const minutesBefore = (now: Date, minutes: number): Date =>
  new Date(now.getTime() - minutes * 60_000);

/** Répartit les 4 états de pin pour que la démo les montre tous. */
const demoAvailability = (index: number, totalSpots: number, now: Date): Availability => {
  switch (index % 5) {
    case 0:
      return Availability.reported(Math.max(1, Math.round(totalSpots * 0.6)), minutesBefore(now, 3));
    case 1:
      return Availability.reported(Math.max(1, Math.round(totalSpots * 0.2)), minutesBefore(now, 12));
    case 2:
      return Availability.reported(0, minutesBefore(now, 6));
    default:
      return Availability.none();
  }
};

const demoScore = (index: number): ParkingScore =>
  index % 3 === 0 ? ParkingScore.of(14, 1) : ParkingScore.of(index % 4, 0);

export const createReimsDemoParkings = (now: Date): ParkingSummary[] =>
  (seed as readonly DemoParkingSeed[]).map((parking, index) =>
    ParkingSummary.create({
      id: parking.id,
      name: parking.name,
      totalSpots: parking.totalSpots,
      photos: [],
      coordinates: Coordinates.fromSnapshot(parking),
      distanceMeters: 0,
      availability: demoAvailability(index, parking.totalSpots, now),
      score: demoScore(index),
      createdAt: SEED_DATE,
    }),
  );
