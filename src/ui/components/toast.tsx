import { createContext, use, useCallback, useEffect, useState, type ReactNode } from 'react';
import styles from './toast.module.css';

type Tone = 'success' | 'error';

interface ToastMessage {
  readonly id: number;
  readonly text: string;
  readonly tone: Tone;
}

type ShowToast = (text: string, tone?: Tone) => void;

const ToastContext = createContext<ShowToast | null>(null);

const DURATION_MS = 3500;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const show = useCallback<ShowToast>((text, tone = 'success') => {
    setToast({ id: Date.now(), text, tone });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), DURATION_MS);
    return () => clearTimeout(id);
  }, [toast]);

  return (
    <ToastContext value={show}>
      {children}
      <div className={styles.region} role="status" aria-live="polite">
        {toast && (
          <p key={toast.id} className={`${styles.toast} ${styles[toast.tone]}`}>
            {toast.text}
          </p>
        )}
      </div>
    </ToastContext>
  );
}

export function useToast(): ShowToast {
  const show = use(ToastContext);
  if (!show) throw new Error('ToastProvider manquant.');
  return show;
}
