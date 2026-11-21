import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './icon-button.module.css';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Texte lu par les lecteurs d'écran. */
  label: string;
  variant?: 'floating' | 'plain';
  children: ReactNode;
}

export function IconButton({
  label,
  variant = 'floating',
  className,
  children,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={[styles.button, styles[variant], className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}
