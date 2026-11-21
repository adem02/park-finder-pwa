import { Availability } from '@domain/availability/availability';
import { Comment } from '@domain/comment/comment';
import { Coordinates } from '@domain/geo/coordinates';
import { Author } from '@domain/user/author';
import { InMemoryParkingStore, type DemoParkingRecord } from './in-memory-parking.store';
import seed from './reims-demo-parkings.json';

/**
 * Parkings gratuits de Reims issus d'OpenStreetMap (© contributeurs OpenStreetMap, ODbL),
 * générés par `npm run seed:demo`. Contributeurs, signalements, votes et commentaires sont fictifs.
 */
interface DemoParkingSeed {
  readonly id: string;
  readonly name: string;
  readonly totalSpots: number;
  readonly latitude: number;
  readonly longitude: number;
}

const SEED_DATE = new Date('2026-07-30T00:00:00Z');

/** Position simulée de l'utilisateur en démo : le centre de Reims, où se trouvent les parkings. */
export const REIMS_DEMO_POSITION = Coordinates.fromSnapshot({ latitude: 49.2583, longitude: 4.0317 });

const DEMO_CONTRIBUTORS = ['camille_r', 'theo51', 'ines.m', 'lucas_reims'].map((username, index) =>
  Author.fromSnapshot({ id: `demo-contributor-${index}`, username, photoUrl: null }),
);

const DEMO_COMMENTS = [
  'Souvent des places en milieu de matinée, plus compliqué le samedi.',
  'Accès facile, bien éclairé le soir.',
  'Attention, le marché occupe une partie du parking le mercredi.',
  'Pratique pour aller au centre à pied, 10 minutes environ.',
  'Revêtement un peu abîmé à l’entrée, rien de grave.',
];

const minutesBefore = (now: Date, minutes: number): Date =>
  new Date(now.getTime() - minutes * 60_000);

const DAY_MS = 24 * 60 * 60 * 1000;

const pick = <T>(items: readonly T[], index: number): T => items[index % items.length] as T;

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

/** Un parking sur deux a des commentaires (de 1 à 4), du plus récent au plus ancien. */
const demoComments = (index: number, now: Date): Comment[] => {
  if (index % 2 === 1) return [];
  const count = (index % 4) + 1;
  return Array.from({ length: count }, (_, position) =>
    Comment.create({
      id: `demo-${index}-comment-${position}`,
      content: pick(DEMO_COMMENTS, index + position),
      author: pick(DEMO_CONTRIBUTORS, index + position + 1),
      createdAt: minutesBefore(now, 60 * (position + 1) * ((index % 5) + 1)),
    }),
  );
};

export const createReimsDemoStore = (now: Date): InMemoryParkingStore =>
  new InMemoryParkingStore(
    (seed as readonly DemoParkingSeed[]).map(
      (parking, index): DemoParkingRecord => ({
        id: parking.id,
        name: parking.name,
        totalSpots: parking.totalSpots,
        photos: [],
        coordinates: Coordinates.fromSnapshot(parking),
        addedBy: pick(DEMO_CONTRIBUTORS, index),
        availability: demoAvailability(index, parking.totalSpots, now),
        // Scores et dates variés : les tris « popularité » et « ajoutés récemment » donnent des ordres distincts.
        upvotes: index % 3 === 0 ? 12 + ((index * 7) % 30) : index % 4,
        downvotes: index % 2,
        userVote: null,
        comments: demoComments(index, now),
        createdAt: new Date(SEED_DATE.getTime() - ((index * 13) % 120) * DAY_MS),
      }),
    ),
  );
