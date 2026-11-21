import { DomainError } from '../shared/domain-error';
import { err, ok, type Result } from '../shared/result';

export interface CoordinatesSnapshot {
  readonly latitude: number;
  readonly longitude: number;
}

export class InvalidCoordinatesError extends DomainError {
  readonly kind = 'InvalidCoordinates';

  constructor(
    readonly latitude: number,
    readonly longitude: number,
  ) {
    super(`Coordonnées invalides : (${latitude}, ${longitude}).`);
  }
}

const EARTH_RADIUS_METERS = 6_371_000;

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

export class Coordinates {
  private constructor(
    readonly latitude: number,
    readonly longitude: number,
  ) {}

  static create(latitude: number, longitude: number): Result<Coordinates, InvalidCoordinatesError> {
    const isValid =
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      Math.abs(latitude) <= 90 &&
      Math.abs(longitude) <= 180;

    return isValid
      ? ok(new Coordinates(latitude, longitude))
      : err(new InvalidCoordinatesError(latitude, longitude));
  }

  /** Réhydrate des coordonnées déjà validées (cache, données de confiance). */
  static fromSnapshot(snapshot: CoordinatesSnapshot): Coordinates {
    return new Coordinates(snapshot.latitude, snapshot.longitude);
  }

  /** Distance à vol d'oiseau en mètres (formule de haversine). */
  distanceTo(other: Coordinates): number {
    const deltaLat = toRadians(other.latitude - this.latitude);
    const deltaLng = toRadians(other.longitude - this.longitude);
    const a =
      Math.sin(deltaLat / 2) ** 2 +
      Math.cos(toRadians(this.latitude)) *
        Math.cos(toRadians(other.latitude)) *
        Math.sin(deltaLng / 2) ** 2;

    return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(a));
  }

  equals(other: Coordinates): boolean {
    return this.latitude === other.latitude && this.longitude === other.longitude;
  }

  toSnapshot(): CoordinatesSnapshot {
    return { latitude: this.latitude, longitude: this.longitude };
  }
}
