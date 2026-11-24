import { useState } from 'react';
import type { ParkingPhoto } from '@domain/parking/parking-photo';
import type { ParkingId } from '@domain/parking/parking-summary';
import { POINTS_PER_PHOTO } from '@domain/parking/parking-photo';
import { Button } from '../../components/button';
import { IconButton } from '../../components/icon-button';
import { CloseIcon, ParkingIcon } from '../../components/icons';
import { Sheet } from '../../components/sheet';
import { useToast } from '../../components/toast';
import { parkingErrorMessage } from './messages';
import { useRemoveParkingPhoto } from './use-parking-photos';
import styles from './parking-details-page.module.css';

interface PhotosCarouselProps {
  parkingId: ParkingId;
  photos: readonly ParkingPhoto[];
  name: string;
}

/** Photos défilables (jusqu'à 3), ou un emplacement neutre. On peut retirer celles qu'on a postées. */
export function PhotosCarousel({ parkingId, photos, name }: PhotosCarouselProps) {
  const [toRemove, setToRemove] = useState<ParkingPhoto | null>(null);
  const removal = useRemoveParkingPhoto();
  const toast = useToast();

  if (photos.length === 0) {
    return (
      <div className={styles.noPhoto}>
        <ParkingIcon width={40} height={40} />
        <span>Pas encore de photo</span>
      </div>
    );
  }

  const confirm = () => {
    if (!toRemove) return;
    removal.mutate(
      { parkingId, photoId: toRemove.id },
      {
        onSuccess: () => {
          setToRemove(null);
          toast('Photo retirée.', 'success');
        },
      },
    );
  };

  return (
    <>
      <ul className={styles.carousel} aria-label={`Photos de ${name}`}>
        {photos.map((photo, index) => (
          <li key={photo.id} className={styles.slide}>
            <img
              src={photo.url}
              alt={`${name}, photo ${index + 1} sur ${photos.length}`}
              loading={index === 0 ? 'eager' : 'lazy'}
            />
            {photo.isMine && (
              <span className={styles.removePhoto}>
                <IconButton label="Retirer ma photo" onClick={() => setToRemove(photo)}>
                  <CloseIcon width={18} height={18} />
                </IconButton>
              </span>
            )}
          </li>
        ))}
      </ul>

      <Sheet open={toRemove !== null} title="Retirer votre photo ?" onClose={() => setToRemove(null)}>
        <div className={styles.deleteSheet}>
          <p>
            Elle disparaîtra du parking. Si elle vous avait rapporté des points ({POINTS_PER_PHOTO} par
            photo ajoutée), ils vous seront repris.
          </p>
          {removal.isError && (
            <p className={styles.deleteError} role="alert">
              {parkingErrorMessage(removal.error)}
            </p>
          )}
          <Button variant="danger" block loading={removal.isPending} onClick={confirm}>
            Retirer la photo
          </Button>
          <Button variant="secondary" block onClick={() => setToRemove(null)}>
            Annuler
          </Button>
        </div>
      </Sheet>
    </>
  );
}
