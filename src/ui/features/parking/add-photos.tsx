import { useState, type ChangeEvent } from 'react';
import { ParkingPhotosFullError } from '@application/parking/add-parking-photos.use-case';
import type { ParkingDetails } from '@domain/parking/parking-details';
import { POINTS_PER_PHOTO } from '@domain/parking/parking-photo';
import { useContainer, useUseCases } from '../../app/container-context';
import { PlusIcon } from '../../components/icons';
import { useToast } from '../../components/toast';
import { photoErrorMessage } from '../add-parking/messages';
import { parkingErrorMessage } from './messages';
import { useAddParkingPhotos } from './use-parking-photos';
import styles from './parking-details-page.module.css';

const uploadErrorMessage = (error: Error): string =>
  error instanceof ParkingPhotosFullError
    ? 'Ce parking a déjà ses 3 photos.'
    : parkingErrorMessage(error);

/**
 * Ajouter des photos à un parking existant (tout utilisateur, 3 au plus en tout) : préparées sur
 * l'appareil comme à la création, puis envoyées. Disparaît quand le parking a ses 3 photos.
 */
export function AddPhotos({ parking }: { parking: ParkingDetails }) {
  const { preparePhoto } = useUseCases();
  const { dataSource } = useContainer();
  const upload = useAddParkingPhotos();
  const toast = useToast();
  const [preparing, setPreparing] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  if (parking.remainingPhotoSlots === 0) return null;
  const busy = preparing || upload.isPending;

  const onFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.target.files ?? [])].slice(0, parking.remainingPhotoSlots);
    event.target.value = '';
    if (files.length === 0) return;

    setPhotoError(null);
    setPreparing(true);
    const results = await Promise.all(files.map((file) => preparePhoto.execute(file, file.name)));
    setPreparing(false);

    const ready = results.flatMap((result) => (result.ok ? [result.value] : []));
    const failure = results.find((result) => !result.ok);
    if (failure && !failure.ok) setPhotoError(photoErrorMessage(failure.error));
    if (ready.length === 0) return;

    upload.mutate(
      { parking, photos: ready },
      {
        onSuccess: () =>
          toast(
            ready.length > 1
              ? `${ready.length} photos ajoutées : +${ready.length * POINTS_PER_PHOTO} points`
              : `Photo ajoutée : +${POINTS_PER_PHOTO} points`,
            'success',
          ),
        // En démo, l'aperçu local tient lieu de photo hébergée : on le garde.
        onSettled: () => {
          if (dataSource !== 'demo') for (const photo of ready) preparePhoto.release(photo);
        },
      },
    );
  };

  const error = photoError ?? (upload.isError ? uploadErrorMessage(upload.error) : null);

  return (
    <div className={styles.addPhotos}>
      <label className={styles.addPhotoButton} aria-disabled={busy}>
        <PlusIcon width={20} height={20} />
        {busy ? 'Envoi de la photo…' : parking.photos.length === 0 ? 'Ajouter la première photo' : 'Ajouter une photo'}
        <input
          type="file"
          accept="image/*"
          multiple
          className={styles.fileInput}
          aria-label="Ajouter des photos"
          disabled={busy}
          onChange={(event) => void onFiles(event)}
        />
      </label>
      {error && (
        <p className={styles.photoError} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
