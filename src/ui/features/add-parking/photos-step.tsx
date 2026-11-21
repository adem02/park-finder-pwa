import { useState, type ChangeEvent } from 'react';
import { PARKING_MAX_PHOTOS } from '@domain/parking/new-parking';
import { IconButton } from '../../components/icon-button';
import { CloseIcon, PlusIcon } from '../../components/icons';
import { photoErrorMessage } from './messages';
import type { usePhotoDraft } from './use-add-parking';
import styles from './add-parking.module.css';

interface PhotosStepProps {
  draft: ReturnType<typeof usePhotoDraft>;
}

/** Étape 3 : 0 à 3 photos, facultatives (décision 1). Prise de vue directe ou galerie. */
export function PhotosStep({ draft }: PhotosStepProps) {
  const [ignored, setIgnored] = useState(0);

  const onFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.target.files ?? [])];
    event.target.value = '';
    setIgnored(draft.add(files));
  };

  return (
    <div className={styles.formStep}>
      <p className={styles.stepIntro}>
        Facultatif : jusqu’à {PARKING_MAX_PHOTOS} photos de l’entrée ou des places aident les autres
        à reconnaître le parking.
      </p>

      <ul className={styles.photos} aria-label="Photos ajoutées">
        {draft.items.map((item, index) => (
          <li key={item.id} className={styles.photo} data-status={item.status}>
            {item.status === 'ready' && (
              <img src={item.photo.previewUrl} alt={`Photo ${index + 1}`} />
            )}
            {item.status === 'processing' && (
              <span className={styles.photoStatus} role="status">
                Préparation…
              </span>
            )}
            {item.status === 'error' && (
              <span className={styles.photoStatus} role="alert">
                {photoErrorMessage(item.error)}
              </span>
            )}
            <IconButton
              label={`Retirer la photo ${index + 1}`}
              variant="plain"
              className={styles.photoRemove}
              onClick={() => draft.remove(item.id)}
            >
              <CloseIcon width={18} height={18} />
            </IconButton>
          </li>
        ))}

        {draft.canAddMore && (
          <li className={styles.photoAdd}>
            <label className={styles.photoPicker}>
              <PlusIcon width={24} height={24} />
              Ajouter
              <input
                type="file"
                accept="image/*"
                multiple
                className={styles.fileInput}
                aria-label="Choisir des photos"
                onChange={onFiles}
              />
            </label>
          </li>
        )}
      </ul>

      {draft.canAddMore && (
        <label className={styles.cameraButton}>
          Prendre une photo
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className={styles.fileInput}
            aria-label="Prendre une photo"
            onChange={onFiles}
          />
        </label>
      )}

      {ignored > 0 && (
        <p className={styles.fieldError} role="status">
          {PARKING_MAX_PHOTOS} photos maximum : {ignored} non ajoutée{ignored > 1 ? 's' : ''}.
        </p>
      )}
    </div>
  );
}
