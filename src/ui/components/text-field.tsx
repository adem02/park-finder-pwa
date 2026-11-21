import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import styles from './text-field.module.css';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  /** Message d'erreur sous le champ ; le champ passe alors en `aria-invalid`. */
  error?: string | null;
  /** Aide permanente sous le champ (liste de critères, précision…). */
  hint?: ReactNode;
  /** Élément dans le champ, à droite (bouton afficher/masquer…). */
  trailing?: ReactNode;
}

export function TextField({ label, error, hint, trailing, className, ...input }: TextFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ');

  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={styles.control} data-invalid={error ? true : undefined}>
        <input
          id={id}
          className={styles.input}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          {...input}
        />
        {trailing}
      </div>
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
      {hint && (
        <div id={hintId} className={styles.hint}>
          {hint}
        </div>
      )}
    </div>
  );
}
