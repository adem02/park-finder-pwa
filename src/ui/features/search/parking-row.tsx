import { Link } from '@tanstack/react-router';
import type { ParkingSummary } from '@domain/parking/parking-summary';
import { AvailabilityBadge } from '../../components/availability-badge';
import { CheckBadgeIcon, ChevronRightIcon, ParkingIcon, ThumbUpIcon } from '../../components/icons';
import { formatDistance } from '../../format/format-distance';
import styles from './search.module.css';

interface ParkingRowProps {
  parking: ParkingSummary;
  now: Date;
}

/** Une ligne de la liste : toute la ligne mène au détail. */
export function ParkingRow({ parking, now }: ParkingRowProps) {
  const { coverPhoto, score } = parking;

  return (
    <Link to="/parking/$parkingId" params={{ parkingId: parking.id }} className={styles.row}>
      <span className={styles.thumb}>
        {coverPhoto ? (
          <img src={coverPhoto} alt="" loading="lazy" decoding="async" />
        ) : (
          <ParkingIcon width={28} height={28} />
        )}
      </span>

      <span className={styles.rowBody}>
        <span className={styles.rowName}>{parking.name}</span>
        <AvailabilityBadge
          availability={parking.availability}
          totalSpots={parking.totalSpots}
          now={now}
        />
        <span className={styles.rowMeta}>
          <span>à {formatDistance(parking.distanceMeters)}</span>
          <span aria-hidden="true">·</span>
          <span>{parking.totalSpots} places</span>
          {parking.isVerified() && (
            <span className={styles.rowVerified}>
              <CheckBadgeIcon width={14} height={14} />
              Vérifié
            </span>
          )}
          {score.upvotes > 0 && (
            <span className={styles.rowScore}>
              <ThumbUpIcon width={14} height={14} />
              <span className={styles.visuallyHidden}>Votes positifs :</span> {score.upvotes}
            </span>
          )}
        </span>
      </span>

      <ChevronRightIcon className={styles.rowChevron} width={18} height={18} />
    </Link>
  );
}
