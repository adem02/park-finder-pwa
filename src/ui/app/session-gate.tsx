import { useQueryClient } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { Button } from '../components/button';
import { ParkingIcon } from '../components/icons';
import { formError } from '../features/auth/messages';
import { isUserData, useSession, useSessionExpiry } from '../features/auth/use-session';
import { useOnlineStatus } from '../hooks/use-online-status';
import type { createAppRouter } from './router';
import styles from './session-gate.module.css';

type AppRouter = ReturnType<typeof createAppRouter>;

/**
 * Attend de savoir qui est connecté avant de monter le routeur, puis lui passe la session :
 * les gardes des routes redirigent dès qu'elle change (connexion, déconnexion, expiration).
 */
export function SessionGate({ router }: { router: AppRouter }) {
  const session = useSession();
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  useSessionExpiry();

  const userId = session.data?.id ?? null;
  const previousUserId = useRef<string | null>(userId);

  useEffect(() => {
    if (!session.isSuccess) return;
    const signedOut = previousUserId.current !== null && userId === null;
    previousUserId.current = userId;
    // Rejoue les gardes avec la nouvelle session ; après une déconnexion, vide le cache
    // une fois sorti des écrans protégés (sinon ils relanceraient leurs requêtes sans jeton).
    void router.invalidate().then(() => {
      if (signedOut) queryClient.removeQueries({ predicate: isUserData });
    });
  }, [router, queryClient, session.isSuccess, userId]);

  // Démarrage hors ligne : on retente dès que le réseau revient.
  const { refetch, isError } = session;
  useEffect(() => {
    if (isOnline && isError) void refetch();
  }, [isOnline, isError, refetch]);

  if (session.isPending) {
    return (
      <div className={styles.splash} role="status" aria-label="Chargement de ParkFinder">
        <ParkingIcon className={styles.logo} width={48} height={48} />
      </div>
    );
  }

  if (session.isError) {
    return (
      <main className={styles.splash}>
        <ParkingIcon className={styles.logo} width={48} height={48} />
        <p className={styles.message} role="alert">
          {formError(session.error) ?? 'Impossible de vérifier votre session.'}
        </p>
        <Button onClick={() => void session.refetch()} loading={session.isFetching}>
          Réessayer
        </Button>
      </main>
    );
  }

  return <RouterProvider router={router} context={{ session: session.data }} />;
}
