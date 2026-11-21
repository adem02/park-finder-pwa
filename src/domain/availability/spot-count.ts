import { DomainError } from '../shared/domain-error';
import { err, ok, type Result } from '../shared/result';

export class InvalidReportError extends DomainError {
  readonly kind = 'InvalidReport';

  constructor(
    readonly spots: number,
    readonly totalSpots: number,
  ) {
    super(`Nombre de places invalide : ${spots} (entre 0 et ${totalSpots}).`);
  }
}

/** Nombre de places libres signalé : entier entre 0 (plein) et le total du parking. */
export class SpotCount {
  private constructor(readonly value: number) {}

  static create(value: number, totalSpots: number): Result<SpotCount, InvalidReportError> {
    if (!Number.isInteger(value) || value < 0 || value > totalSpots) {
      return err(new InvalidReportError(value, totalSpots));
    }
    return ok(new SpotCount(value));
  }

  isFull(): boolean {
    return this.value === 0;
  }
}
