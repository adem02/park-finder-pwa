import { Coordinates } from '../geo/coordinates';
import { DomainError } from '../shared/domain-error';
import { err, ok, type Result } from '../shared/result';

/** Règles d'ajout (docs/decisions.md, `NewParkingInputDto` et `FileValidationPipe` de l'API). */
export const PARKING_NAME_MIN_LENGTH = 3;
export const PARKING_NAME_MAX_LENGTH = 100;
export const PARKING_SPOTS_MIN = 1;
export const PARKING_SPOTS_MAX = 1000;
export const PARKING_MAX_PHOTOS = 3;
export const PARKING_PHOTO_MAX_BYTES = 3 * 1024 * 1024;
export const PARKING_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
/** L'API refuse un parking à moins de 50 m d'un parking existant. */
export const DUPLICATE_PARKING_RADIUS_METERS = 50;

export type NewParkingField = 'name' | 'totalSpots' | 'coordinates' | 'photos';
export type NewParkingProblem = 'required' | 'too-short' | 'too-long' | 'out-of-range' | 'too-many';
export type NewParkingProblems = Partial<Record<NewParkingField, NewParkingProblem>>;

export class InvalidNewParkingError extends DomainError {
  readonly kind = 'InvalidNewParking';

  constructor(readonly problems: NewParkingProblems) {
    super(`Parking invalide : ${Object.keys(problems).join(', ')}.`);
  }
}

export interface NewParkingInput {
  readonly name: string;
  readonly totalSpots: number;
  readonly latitude: number;
  readonly longitude: number;
  readonly photoCount: number;
}

export const nameProblem = (raw: string): NewParkingProblem | null => {
  const name = raw.trim();
  if (name.length === 0) return 'required';
  if (name.length < PARKING_NAME_MIN_LENGTH) return 'too-short';
  if (name.length > PARKING_NAME_MAX_LENGTH) return 'too-long';
  return null;
};

export const totalSpotsProblem = (spots: number): NewParkingProblem | null =>
  Number.isInteger(spots) && spots >= PARKING_SPOTS_MIN && spots <= PARKING_SPOTS_MAX
    ? null
    : 'out-of-range';

/** Un parking proposé par un utilisateur, prêt à être envoyé. Les photos sont jointes à part. */
export class NewParking {
  private constructor(
    readonly name: string,
    readonly totalSpots: number,
    readonly coordinates: Coordinates,
  ) {}

  static create(input: NewParkingInput): Result<NewParking, InvalidNewParkingError> {
    const coordinates = Coordinates.create(input.latitude, input.longitude);
    const problems: NewParkingProblems = Object.fromEntries(
      (
        [
          ['name', nameProblem(input.name)],
          ['totalSpots', totalSpotsProblem(input.totalSpots)],
          ['coordinates', coordinates.ok ? null : 'required'],
          ['photos', input.photoCount > PARKING_MAX_PHOTOS ? 'too-many' : null],
        ] as const
      ).filter(([, problem]) => problem !== null),
    );

    if (Object.keys(problems).length > 0 || !coordinates.ok) {
      return err(new InvalidNewParkingError(problems));
    }
    return ok(new NewParking(input.name.trim(), input.totalSpots, coordinates.value));
  }
}
