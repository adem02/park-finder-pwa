import type { ParkingSummary } from '@domain/parking/parking-summary';
import { CheckBadgeIcon, CloseIcon } from '../../components/icons';
import { IconButton } from '../../components/icon-button';
import { formatDistance } from '../../format/format-distance';
import { AvailabilityBadge } from './availability-badge';
import styles from './parking-preview-card.module.css';

interface ParkingPreviewCardProps {
  parking: ParkingSummary;
  now: Date;
  onClose: () => void;
}

export function ParkingPreviewCard({ parking, now, onClose }: ParkingPreviewCardProps) {
  return (
    <article className={styles.card} aria-label={`Parking ${parking.name}`}>
      <header className={styles.header}>
        <div className={styles.titles}>
          <h2 className={styles.name}>{parking.name}</h2>
          {parking.isVerified() && (
            <span className={styles.verified}>
              <CheckBadgeIcon />
              Vérifié
            </span>
          )}
        </div>
        <IconButton label="Fermer" variant="plain" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </header>

      <AvailabilityBadge parking={parking} now={now} />

      <p className={styles.meta}>
        {parking.totalSpots} places au total · à {formatDistance(parking.distanceMeters)}
      </p>
    </article>
  );
}
