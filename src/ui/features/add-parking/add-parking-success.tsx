import { Link } from '@tanstack/react-router';
import { CheckIcon } from '../../components/icons';
import styles from './add-parking.module.css';

const CONFETTI_COLORS = [
  'confettiPrimary',
  'confettiSuccess',
  'confettiWarning',
  'confettiDanger',
] as const;
const CONFETTI = Array.from({ length: 18 }, (_, index) => ({
  left: `${(index * 53) % 100}%`,
  delay: `${(index % 6) * 120}ms`,
  tone: CONFETTI_COLORS[index % CONFETTI_COLORS.length] ?? 'confettiPrimary',
}));

/** Fin du parcours (DS P6) : confettis, « +20 points », puis voir le parking ou revenir à la carte. */
export function AddParkingSuccess({ parkingId }: { parkingId: string }) {
  return (
    <main className={styles.success}>
      <div className={styles.confetti} aria-hidden="true">
        {CONFETTI.map((piece, index) => (
          <span
            key={index}
            className={`${styles.confettiPiece} ${styles[piece.tone]}`}
            style={{ left: piece.left, animationDelay: piece.delay }}
          />
        ))}
      </div>

      <div className={styles.successBadge}>
        <CheckIcon width={40} height={40} />
      </div>
      <h1 className={styles.successTitle}>Parking ajouté !</h1>
      <p className={styles.points}>+20 points</p>
      <p className={styles.successText}>
        Merci ! Il est maintenant visible par toute la communauté.
      </p>

      <div className={styles.successActions}>
        <Link
          to="/parking/$parkingId"
          params={{ parkingId }}
          replace
          className={styles.primaryLink}
        >
          Voir le parking
        </Link>
        <Link to="/" replace className={styles.secondaryLink}>
          Retour à la carte
        </Link>
      </div>
    </main>
  );
}
