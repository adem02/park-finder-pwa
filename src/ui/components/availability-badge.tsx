import type { Availability } from '@domain/availability/availability';
import { formatTimeAgo } from '../format/format-time-ago';
import styles from './availability-badge.module.css';

interface AvailabilityBadgeProps {
  availability: Availability;
  totalSpots: number;
  now: Date;
}

/** Badge du DS : gris sans info, rouge si complet, orange si moins d'un tiers, vert sinon. */
export function AvailabilityBadge({ availability, totalSpots, now }: AvailabilityBadgeProps) {
  const level = availability.level(totalSpots, now);
  const spots = availability.spotsAt(now);
  const { reportedAt } = availability;

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
