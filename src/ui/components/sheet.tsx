import { useEffect, useId, useRef, type ReactNode } from 'react';
import { IconButton } from './icon-button';
import { CloseIcon } from './icons';
import styles from './sheet.module.css';

interface SheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** Feuille du bas, construite sur <dialog> : focus piégé, Échap et toucher le fond la ferment. */
export function Sheet({ open, title, onClose, children }: SheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.sheet}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={styles.content}>
        <header className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <IconButton label="Fermer" variant="plain" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </header>
        {children}
      </div>
    </dialog>
  );
}
