import { Outlet } from '@tanstack/react-router';
import { useOnlineStatus } from '../hooks/use-online-status';
import { UpdatePrompt } from './update-prompt';
import styles from './root-layout.module.css';

export function RootLayout() {
  const isOnline = useOnlineStatus();

  return (
    <div className={styles.app} data-offline={!isOnline}>
      {!isOnline && (
        <p className={styles.offline} role="status">
          Hors ligne · consultation seule
        </p>
      )}
      <Outlet />
      <UpdatePrompt />
    </div>
  );
}

export function NotFound() {
  return (
    <main className={styles.notFound}>
      <h1>Page introuvable</h1>
      <a href="/">Retour à la carte</a>
    </main>
  );
}
