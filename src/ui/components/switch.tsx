import styles from './switch.module.css';

interface SwitchProps {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** Interrupteur on/off : case à cocher native exposée en `role="switch"`. */
export function Switch({ label, hint, checked, onChange }: SwitchProps) {
  return (
    <label className={styles.row}>
      <span className={styles.texts}>
        <span className={styles.label}>{label}</span>
        {hint && <span className={styles.hint}>{hint}</span>}
      </span>
      <input
        type="checkbox"
        role="switch"
        className={styles.switch}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}
