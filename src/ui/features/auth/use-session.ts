import { useMutation, useQuery, useQueryClient, type Query } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import type { LoginInput } from '@application/auth/login.use-case';
import type { RegisterInput } from '@application/auth/register.use-case';
import { CurrentUser, type CurrentUserSnapshot } from '@domain/user/current-user';
import { useContainer, useUseCases } from '../../app/container-context';
import { useToast } from '../../components/toast';
import { sessionKeys } from '../../query/query-keys';
import { unwrap } from '../../query/unwrap';

const toUser = (snapshot: CurrentUserSnapshot | null): CurrentUser | null =>
  snapshot ? CurrentUser.fromSnapshot(snapshot) : null;

/** Tout le cache sauf la session : les données d'un utilisateur ne doivent pas survivre à sa déconnexion. */
export const isUserData = (query: Query): boolean => query.queryKey[0] !== sessionKeys.current[0];

/** L'utilisateur connecté (`null` si personne), restauré au démarrage avec le cookie de refresh. */
export function useSession() {
  const { restoreSession } = useUseCases();

  return useQuery({
    queryKey: sessionKeys.current,
    queryFn: async () => {
      const user = await unwrap(restoreSession.execute());
      return user?.toSnapshot() ?? null;
    },
    select: toUser,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

function useSignedIn() {
  const queryClient = useQueryClient();
  return useCallback(
    (user: CurrentUser) => {
      queryClient.removeQueries({ predicate: isUserData });
      queryClient.setQueryData(sessionKeys.current, user.toSnapshot());
    },
    [queryClient],
  );
}

/**
 * Passe la session à `null` : les routes protégées redirigent vers la connexion.
 * Le reste du cache est vidé une fois la redirection faite (voir SessionGate).
 */
export function useSignedOut() {
  const queryClient = useQueryClient();
  return useCallback(() => {
    void queryClient.cancelQueries({ predicate: isUserData });
    queryClient.setQueryData(sessionKeys.current, null);
  }, [queryClient]);
}

export function useLogin() {
  const { login } = useUseCases();
  const signedIn = useSignedIn();
  return useMutation({
    mutationFn: (input: LoginInput) => unwrap(login.execute(input)),
    onSuccess: signedIn,
  });
}

export function useRegister() {
  const { register } = useUseCases();
  const signedIn = useSignedIn();
  return useMutation({
    mutationFn: (input: RegisterInput) => unwrap(register.execute(input)),
    onSuccess: signedIn,
  });
}

export function useLogout() {
  const { logout } = useUseCases();
  const signedOut = useSignedOut();
  return useMutation({
    mutationFn: () => logout.execute(),
    onSettled: signedOut,
  });
}

/** Session expirée en cours d'utilisation (refresh refusé) : retour à la connexion, avec un mot d'explication. */
export function useSessionExpiry(): void {
  const { sessionExpiry } = useContainer();
  const signedOut = useSignedOut();
  const toast = useToast();

  useEffect(
    () =>
      sessionExpiry.onExpired(() => {
        signedOut();
        toast('Votre session a expiré. Reconnectez-vous.', 'error');
      }),
    [sessionExpiry, signedOut, toast],
  );
}
