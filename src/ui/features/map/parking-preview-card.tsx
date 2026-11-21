import { Link } from '@tanstack/react-router';
import type { ParkingSummary } from '@domain/parking/parking-summary';
import { AvailabilityBadge } from '../../components/availability-badge';
import { ChevronRightIcon, CheckBadgeIcon, CloseIcon } from '../../components/icons';
import { IconButton } from '../../components/icon-button';
import { formatDistance } from '../../format/format-distance';
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

      <AvailabilityBadge
        availability={parking.availability}
        totalSpots={parking.totalSpots}
        now={now}
      />

      <p className={styles.meta}>
        {parking.totalSpots} places au total · à {formatDistance(parking.distanceMeters)}
      </p>

      <Link
        to="/parking/$parkingId"
        params={{ parkingId: parking.id }}
        className={styles.detailsLink}
      >
        Voir le détail
        <ChevronRightIcon width={18} height={18} />
      </Link>
    </article>
  );
}
