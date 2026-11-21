import { useId } from 'react';
import { MinusIcon, PlusIcon } from './icons';
import styles from './stepper.module.css';

interface StepperProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

/** Stepper numérique du DS : « − valeur + », saisie directe possible. */
export function Stepper({ label, value, min, max, onChange }: StepperProps) {
  const inputId = useId();
  const clamp = (next: number) => Math.min(max, Math.max(min, next));

  return (
    <div className={styles.stepper}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
      </label>
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.step}
          aria-label="Retirer une place"
          disabled={value <= min}
          onClick={() => onChange(clamp(value - 1))}
        >
          <MinusIcon />
        </button>
        <input
          id={inputId}
          className={styles.value}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value}
          onChange={(event) => {
            const parsed = Number.parseInt(event.target.value, 10);
            onChange(Number.isNaN(parsed) ? min : clamp(parsed));
          }}
        />
        <button
          type="button"
          className={styles.step}
          aria-label="Ajouter une place"
          disabled={value >= max}
          onClick={() => onChange(clamp(value + 1))}
        >
          <PlusIcon />
        </button>
      </div>
    </div>
  );
}
