// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { CurrentUserSnapshot } from '@domain/user/current-user';
import { LoginPage } from '@ui/features/auth/login-page';
import { RegisterPage } from '@ui/features/auth/register-page';
import { sessionKeys } from '@ui/query/query-keys';
import { createTestContainer, renderInApp } from '../../support/render-in-app';

afterEach(cleanup);

const renderSignedOut = (page: React.ReactElement) => {
  const { container } = createTestContainer([], { signedIn: false });
  return renderInApp(page, container);
};

/** Le routeur de test rend l'écran de façon asynchrone : on attend chaque champ avant de le remplir. */
const type = async (label: RegExp | string, value: string) =>
  fireEvent.change(await screen.findByLabelText(label), { target: { value } });

describe('LoginPage', () => {
  it('ouvre la session avec les bons identifiants', async () => {
    const { queryClient } = renderSignedOut(<LoginPage />);

    await type('Email', 'demo@parkfinder.app');
    await type('Mot de passe', 'Demo123!');
    fireEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

    await waitFor(() =>
      expect(queryClient.getQueryData<CurrentUserSnapshot>(sessionKeys.current)?.email).toBe(
        'demo@parkfinder.app',
      ),
    );
  });

  it('affiche un message clair si les identifiants sont refusés', async () => {
    renderSignedOut(<LoginPage />);

    await type('Email', 'demo@parkfinder.app');
    await type('Mot de passe', 'Mauvais1!');
    fireEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Email ou mot de passe incorrect.');
  });

  it('signale les champs manquants sous chaque champ', async () => {
    renderSignedOut(<LoginPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Se connecter' }));

    expect(await screen.findByText('Saisissez votre email.')).toBeInTheDocument();
    expect(screen.getByText('Saisissez votre mot de passe.')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });

  it('permet d’afficher le mot de passe saisi', async () => {
    renderSignedOut(<LoginPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Afficher le mot de passe' }));

    expect(screen.getByLabelText('Mot de passe')).toHaveAttribute('type', 'text');
  });
});

describe('RegisterPage', () => {
  it('coche les critères du mot de passe au fil de la saisie', async () => {
    renderSignedOut(<RegisterPage />);

    await type('Mot de passe', 'abcdef');

    const rules = within(screen.getByRole('list', { name: 'Critères du mot de passe' }));
    expect(rules.getByText('6 à 20 caractères').closest('li')).toHaveAttribute('data-met', 'true');
    expect(rules.getByText('Une majuscule').closest('li')).not.toHaveAttribute('data-met');
  });

  it('indique sous le champ email qu’un compte existe déjà', async () => {
    renderSignedOut(<RegisterPage />);

    await type('Nom d’utilisateur', 'camille');
    await type('Email', 'demo@parkfinder.app');
    await type('Mot de passe', 'Secret1!');
    fireEvent.click(screen.getByRole('button', { name: 'Créer mon compte' }));

    expect(await screen.findByText(/Un compte existe déjà avec cet email/)).toBeInTheDocument();
  });

  it('crée le compte et ouvre la session', async () => {
    const { queryClient } = renderSignedOut(<RegisterPage />);

    await type('Nom d’utilisateur', 'camille');
    await type('Email', 'camille@parkfinder.app');
    await type('Mot de passe', 'Secret1!');
    fireEvent.click(screen.getByRole('button', { name: 'Créer mon compte' }));

    await waitFor(() =>
      expect(queryClient.getQueryData<CurrentUserSnapshot>(sessionKeys.current)?.username).toBe('camille'),
    );
  });
});
