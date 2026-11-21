import type { ParkingSummary } from '@domain/parking/parking-summary';
import { formatTimeAgo } from '../../format/format-time-ago';
import styles from './availability-badge.module.css';

export function AvailabilityBadge({ parking, now }: { parking: ParkingSummary; now: Date }) {
  const level = parking.availabilityLevel(now);
  const spots = parking.availableSpotsAt(now);
  const reportedAt = parking.availability.reportedAt;

  const label =
    spots === null
      ? 'Pas d’info récente'
      : spots === 0
        ? 'Complet'
        : `${spots} place${spots > 1 ? 's' : ''} libre${spots > 1 ? 's' : ''}`;

  return (
    <span className={`${styles.badge} ${styles[level]}`}>
      <span className={styles.dot} aria-hidden="true" />
      {label}
      {spots !== null && reportedAt && (
        <span className={styles.when}> · {formatTimeAgo(reportedAt, now)}</span>
      )}
    </span>
  );
}
