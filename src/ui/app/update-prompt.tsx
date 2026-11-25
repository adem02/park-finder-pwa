import { useRegisterSW } from 'virtual:pwa-register/react';
import styles from './update-prompt.module.css';

/**
 * Propose de recharger quand une nouvelle version du service worker est prête.
 * Monté hors du routeur : visible aussi sur l'écran de chargement et sur l'erreur de session,
 * sinon une version qui corrige le démarrage ne pourrait jamais s'installer.
 */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className={styles.toast} role="status">
      <span>Nouvelle version disponible.</span>
      <button type="button" className={styles.toastAction} onClick={() => void updateServiceWorker(true)}>
        Mettre à jour
      </button>
      <button type="button" className={styles.toastDismiss} onClick={() => setNeedRefresh(false)}>
        Plus tard
      </button>
    </div>
  );
}
