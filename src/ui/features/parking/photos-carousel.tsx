import { ParkingIcon } from '../../components/icons';
import styles from './parking-details-page.module.css';

/** Photos défilables (jusqu'à 3), ou un emplacement neutre s'il n'y en a pas. */
export function PhotosCarousel({ photos, name }: { photos: readonly string[]; name: string }) {
  if (photos.length === 0) {
    return (
      <div className={styles.noPhoto}>
        <ParkingIcon width={40} height={40} />
        <span>Pas encore de photo</span>
      </div>
    );
  }

  return (
    <ul className={styles.carousel} aria-label={`Photos de ${name}`}>
      {photos.map((url, index) => (
        <li key={url} className={styles.slide}>
          <img
            src={url}
            alt={`${name}, photo ${index + 1} sur ${photos.length}`}
            loading={index === 0 ? 'eager' : 'lazy'}
          />
        </li>
      ))}
    </ul>
  );
}
