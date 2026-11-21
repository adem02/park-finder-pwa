// @vitest-environment jsdom
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CurrentUser } from '@domain/user/current-user';
import { DEMO_USER } from '@infrastructure/in-memory/in-memory-parking.store';
import { LeaderboardPage } from '@ui/features/profile/leaderboard-page';
import { ProfilePage } from '@ui/features/profile/profile-page';
import { aRecord } from '../../support/parking.builder';
import { createTestContainer, renderInApp } from '../../support/render-in-app';

afterEach(cleanup);

const me = CurrentUser.fromSnapshot({ id: DEMO_USER.id, username: 'Vous', email: 'demo@parkfinder.app', photoUrl: null });

const textIs = (text: string) => (_: string, element: Element | null) => element?.textContent === text;

describe('ProfilePage', () => {
  it('montre la progression, les contributions et les parkings ajoutés', async () => {
    const { container, store } = createTestContainer([
      aRecord({ id: 'mine', name: 'Parking du marché', addedBy: DEMO_USER }),
      aRecord({ id: 'voted', userVote: 'UPVOTE' }),
    ]);
    store.recordReport();
    renderInApp(<ProfilePage user={me} />, container);

    expect(await screen.findByText('26 pts')).toBeInTheDocument();
    expect(screen.getByText('74 points avant le niveau 1')).toBeInTheDocument();
    expect(screen.getByText(textIs('1 Parkings ajoutés'))).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Parking du marché/ })).toHaveAttribute('href', '/parking/mine');
    expect(screen.getByRole('link', { name: /ce mois-ci/ })).toHaveAttribute('href', '/leaderboard');
  });

  it('guide un nouveau venu sans contribution', async () => {
    const { container } = createTestContainer([]);
    renderInApp(<ProfilePage user={me} />, container);

    expect(await screen.findByText(/pour gagner vos premiers points/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'En ajouter un' })).toHaveAttribute('href', '/add');
    expect(screen.getByRole('button', { name: 'Se déconnecter' })).toBeInTheDocument();
  });
});

describe('LeaderboardPage', () => {
  it('met en avant l’utilisateur et bloque la navigation vers le futur', async () => {
    const { container } = createTestContainer([aRecord({ id: 'mine', addedBy: DEMO_USER })]);
    renderInApp(<LeaderboardPage user={me} />, container);

    const board = await screen.findByRole('list', { name: /Classement de/ });
    expect(within(board).getByText('(vous)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mois suivant' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Mois précédent' }));

    expect(screen.getByRole('button', { name: 'Mois suivant' })).toBeEnabled();
  });
});
