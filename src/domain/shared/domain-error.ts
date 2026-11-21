/**
 * Erreur métier attendue. `kind` permet à l'UI de faire un switch exhaustif.
 */
export abstract class DomainError extends Error {
  abstract readonly kind: string;

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
