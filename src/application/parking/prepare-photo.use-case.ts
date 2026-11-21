import type { Result } from '@domain/shared/result';
import type { PhotoError, PhotoProcessor, PreparedPhoto } from '../ports/photo-processor.port';

export class PreparePhoto {
  constructor(private readonly processor: PhotoProcessor) {}

  execute(file: Blob, fileName: string): Promise<Result<PreparedPhoto, PhotoError>> {
    return this.processor.prepare(file, fileName);
  }

  release(photo: PreparedPhoto): void {
    this.processor.release(photo);
  }
}
