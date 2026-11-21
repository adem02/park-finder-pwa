import { useState } from 'react';
import { EyeIcon, EyeOffIcon } from './icons';
import { TextField, type TextFieldProps } from './text-field';
import styles from './text-field.module.css';

/** Champ mot de passe avec bouton afficher/masquer (utile sur mobile, où l'on tape à l'aveugle). */
export function PasswordField(props: Omit<TextFieldProps, 'type' | 'trailing'>) {
  const [visible, setVisible] = useState(false);
  const label = visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe';

  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      trailing={
        <button
          type="button"
          className={styles.reveal}
          aria-label={label}
          title={label}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeOffIcon width={20} height={20} /> : <EyeIcon width={20} height={20} />}
        </button>
      }
    />
  );
}
