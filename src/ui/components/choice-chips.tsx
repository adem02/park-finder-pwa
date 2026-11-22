import { useId } from 'react';
import styles from './choice-chips.module.css';

export interface Choice<T extends string | number> {
  readonly value: T;
  readonly label: string;
}

interface ChoiceChipsProps<T extends string | number> {
  legend: string;
  options: readonly Choice<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** Choix unique parmi quelques options, en pastilles. Boutons radio natifs : clavier et lecteurs d'écran inclus. */
export function ChoiceChips<T extends string | number>({
  legend,
  options,
  value,
  onChange,
}: ChoiceChipsProps<T>) {
  const name = useId();

  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.chips}>
        {options.map((option) => (
          <label key={option.value} className={styles.chip}>
            <input
              type="radio"
              className={styles.input}
              name={name}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
