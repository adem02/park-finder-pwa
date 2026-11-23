// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RestoreSession } from '@application/auth/restore-session.use-case';
import { NetworkError } from '@application/errors/gateway.errors';
import type { AuthGateway } from '@application/ports/auth.gateway';
import { err } from '@domain/shared/result';
import { ContainerProvider } from '@ui/app/container-context';
import { createAppRouter } from '@ui/app/router';
import { SessionGate } from '@ui/app/session-gate';
import { ToastProvider } from '@ui/components/toast';
import { createTestContainer } from '../../support/render-in-app';

const setOnline = (online: boolean) =>
  Object.defineProperty(navigator, 'onLine', { value: online, configurable: true });

afterEach(() => {
  cleanup();
  setOnline(true);
});

/** API injoignable (panne, CORS refusé…) : chaque reprise de session échoue. */
function renderWithUnreachableApi() {
  const resume = vi.fn<AuthGateway['resume']>(() =>
    Promise.resolve(err(new NetworkError('unreachable'))),
  );
  const auth: AuthGateway = { resume, login: vi.fn(), register: vi.fn(), logout: vi.fn() };
  const { container } = createTestContainer([]);
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  render(
    <ContainerProvider
      container={{
        ...container,
        useCases: { ...container.useCases, restoreSession: new RestoreSession(auth) },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <SessionGate router={createAppRouter()} />
        </ToastProvider>
      </QueryClientProvider>
    </ContainerProvider>,
  );
  return { resume };
}

const waitAMoment = () => act(() => new Promise((resolve) => setTimeout(resolve, 100)));

describe('SessionGate', () => {
  it('ne relance pas la reprise de session en boucle quand l’API est injoignable', async () => {
    const { resume } = renderWithUnreachableApi();

    expect(await screen.findByRole('button', { name: 'Réessayer' })).toBeTruthy();
    await waitAMoment();

    expect(resume).toHaveBeenCalledTimes(1);
  });

  it('retente une seule fois au retour du réseau', async () => {
    setOnline(false);
    const { resume } = renderWithUnreachableApi();
    await screen.findByRole('button', { name: 'Réessayer' });

    act(() => {
      setOnline(true);
      window.dispatchEvent(new Event('online'));
    });
    await waitAMoment();

    expect(resume).toHaveBeenCalledTimes(2);
  });
});
