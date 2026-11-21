import type { Result } from '@domain/shared/result';

/** Photo prête à l'envoi : redimensionnée, compressée, dans un format accepté par l'API. */
export interface PreparedPhoto {
  readonly blob: Blob;
  readonly fileName: string;
  /** Aperçu local (`blob:`), à libérer avec `release`. */
  readonly previewUrl: string;
}

export class PhotoUnreadableError extends Error {
  readonly kind = 'PhotoUnreadable';

  constructor() {
    super('Impossible de lire cette image.');
    this.name = 'PhotoUnreadableError';
  }
}

export class PhotoTooLargeError extends Error {
  readonly kind = 'PhotoTooLarge';

  constructor() {
    super('Image trop lourde, même après compression.');
    this.name = 'PhotoTooLargeError';
  }
}

export type PhotoError = PhotoUnreadableError | PhotoTooLargeError;

/** Prépare les photos côté appareil : envoi plus rapide en 4G et sous la limite de 3 Mo de l'API. */
export interface PhotoProcessor {
  prepare(file: Blob, fileName: string): Promise<Result<PreparedPhoto, PhotoError>>;
  release(photo: PreparedPhoto): void;
}
