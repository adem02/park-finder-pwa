// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RestoreSession } from '@application/auth/restore-session.use-case';
import { NetworkError } from '@application/errors/gateway.errors';
import type { AuthGateway } from '@application/ports/auth.gateway';
import { err } from '@domain/shared/result';
import { App } from '@ui/app/app';
import { createTestContainer } from '../../support/render-in-app';

// Une nouvelle version du service worker attend d'être activée.
vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    needRefresh: [true, vi.fn()],
    offlineReady: [false, vi.fn()],
    updateServiceWorker: vi.fn(),
  }),
}));

afterEach(cleanup);

describe('App', () => {
  it('propose la nouvelle version même quand la session ne peut pas être vérifiée', async () => {
    const auth: AuthGateway = {
      resume: () => Promise.resolve(err(new NetworkError('unreachable'))),
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      deleteAccount: vi.fn(),
    };
    const { container } = createTestContainer([]);

    render(
      <App
        container={{
          ...container,
          useCases: { ...container.useCases, restoreSession: new RestoreSession(auth) },
        }}
      />,
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('Le serveur ne répond pas');
    expect(screen.getByText('Nouvelle version disponible.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mettre à jour' })).toBeInTheDocument();
  });
});
