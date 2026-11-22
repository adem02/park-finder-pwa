import {
  PhotoTooLargeError,
  PhotoUnreadableError,
  type PhotoError,
  type PhotoProcessor,
  type PreparedPhoto,
} from '@application/ports/photo-processor.port';
import { PARKING_PHOTO_MAX_BYTES } from '@domain/parking/new-parking';
import { err, ok, type Result } from '@domain/shared/result';

/** Assez pour un écran de téléphone, et ~200 à 400 Ko par photo au lieu de 3 à 8 Mo. */
const MAX_DIMENSION_PX = 1600;
const JPEG_QUALITY = 0.82;

const toJpegName = (fileName: string): string => `${fileName.replace(/\.[^./\\]+$/, '') || 'photo'}.jpg`;

const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob | null> =>
  new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));

/**
 * Redimensionne et réencode en JPEG dans le navigateur. JPEG plutôt que WebP :
 * Safari ne sait pas encoder du WebP depuis un canvas. L'orientation EXIF est appliquée au décodage.
 */
export class CanvasPhotoProcessor implements PhotoProcessor {
  async prepare(file: Blob, fileName: string): Promise<Result<PreparedPhoto, PhotoError>> {
    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      return err(new PhotoUnreadableError());
    }

    const scale = Math.min(1, MAX_DIMENSION_PX / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext('2d');
    if (!context) {
      bitmap.close();
      return err(new PhotoUnreadableError());
    }
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await canvasToBlob(canvas);
    if (!blob) return err(new PhotoUnreadableError());
    if (blob.size > PARKING_PHOTO_MAX_BYTES) return err(new PhotoTooLargeError());

    return ok({ blob, fileName: toJpegName(fileName), previewUrl: URL.createObjectURL(blob) });
  }

  release(photo: PreparedPhoto): void {
    URL.revokeObjectURL(photo.previewUrl);
  }
}
