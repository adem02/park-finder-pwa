import type { PhotoProcessor, PreparedPhoto } from '@application/ports/photo-processor.port';
import { PhotoUnreadableError } from '@application/ports/photo-processor.port';
import { err, ok } from '@domain/shared/result';

/** jsdom ne décode pas les images : la « préparation » garde le fichier tel quel. Un nom en .txt échoue. */
export class FakePhotoProcessor implements PhotoProcessor {
  readonly released: PreparedPhoto[] = [];

  prepare(file: Blob, fileName: string) {
    if (fileName.endsWith('.txt')) return Promise.resolve(err(new PhotoUnreadableError()));
    return Promise.resolve(ok({ blob: file, fileName, previewUrl: `blob:fake/${fileName}` }));
  }

  release(photo: PreparedPhoto): void {
    this.released.push(photo);
  }
}
