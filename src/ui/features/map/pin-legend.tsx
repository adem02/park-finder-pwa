import { PIN_STATES, type PinState } from '@domain/parking/pin-state';
import styles from './map-page.module.css';

const LABELS: Record<PinState, string> = {
  recent: 'Libre < 10 min',
  stale: 'Info ancienne',
  full: 'Complet',
  unknown: 'Pas d’info',
};

export function PinLegend() {
  return (
    <ul className={styles.legend} aria-label="Légende des pins">
      {PIN_STATES.map((state) => (
        <li key={state} className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles[state]}`} aria-hidden="true" />
          {LABELS[state]}
        </li>
      ))}
    </ul>
  );
}
