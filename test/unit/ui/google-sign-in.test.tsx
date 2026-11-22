// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { LoginPage } from '@ui/features/auth/login-page';
import { isOAuthErrorCode } from '@ui/features/auth/oauth-error';
import { RegisterPage } from '@ui/features/auth/register-page';
import { createTestContainer, renderInApp } from '../../support/render-in-app';

afterEach(cleanup);

const GOOGLE_URL = 'https://api.parkfinder.test/auth/google';

const apiModeContainer = () => {
  const { container } = createTestContainer([], { signedIn: false });
  return { ...container, dataSource: 'api' as const, googleSignInUrl: GOOGLE_URL };
};

describe('Connexion Google', () => {
  it('propose « Continuer avec Google » vers l’API sur la connexion et l’inscription', async () => {
    renderInApp(<LoginPage />, apiModeContainer());
    expect(await screen.findByRole('link', { name: /Continuer avec Google/ })).toHaveAttribute(
      'href',
      GOOGLE_URL,
    );
    cleanup();

    renderInApp(<RegisterPage />, apiModeContainer());
    expect(await screen.findByRole('link', { name: /Continuer avec Google/ })).toHaveAttribute(
      'href',
      GOOGLE_URL,
    );
  });

  it('ne l’affiche pas en mode démo (pas d’API)', async () => {
    const { container } = createTestContainer([], { signedIn: false });
    renderInApp(<LoginPage />, container);

    expect(await screen.findByRole('button', { name: 'Se connecter' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Google/ })).not.toBeInTheDocument();
  });

  it('explique un échec de connexion Google renvoyé par l’API', async () => {
    renderInApp(<LoginPage oauthError="google_failed" />, apiModeContainer());

    expect(await screen.findByRole('alert')).toHaveTextContent(/annulée ou n’a pas abouti/);
  });

  it('n’accepte que les codes d’erreur connus dans l’URL', () => {
    expect(isOAuthErrorCode('google_unavailable')).toBe(true);
    expect(isOAuthErrorCode('<script>')).toBe(false);
    expect(isOAuthErrorCode(undefined)).toBe(false);
  });
});
