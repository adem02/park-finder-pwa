// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { LoginPage } from '@ui/features/auth/login-page';
import { PRIVACY_CONTACT, PrivacyPage } from '@ui/features/legal/privacy-page';
import { createTestContainer, renderInApp } from '../../support/render-in-app';

afterEach(cleanup);

const renderSignedOut = (page: React.ReactElement) =>
  renderInApp(page, createTestContainer([], { signedIn: false }).container);

describe('PrivacyPage', () => {
  it('donne le contact pour exercer ses droits', async () => {
    renderSignedOut(<PrivacyPage />);

    expect(
      await screen.findByRole('heading', { name: 'Politique de confidentialité' }),
    ).toBeTruthy();
    const contacts = screen.getAllByRole('link', { name: PRIVACY_CONTACT });
    expect(contacts[0]?.getAttribute('href')).toBe(`mailto:${PRIVACY_CONTACT}`);
  });

  it('mentionne les journaux techniques et leur durée de conservation', async () => {
    renderSignedOut(<PrivacyPage />);

    expect(await screen.findByText(/type de navigateur/)).toBeTruthy();
    expect(screen.getByText('Journaux techniques : 7 jours.')).toBeTruthy();
  });

  it('est accessible depuis la connexion', async () => {
    renderSignedOut(<LoginPage />);

    const link = await screen.findByRole('link', { name: 'Confidentialité' });
    expect(link.getAttribute('href')).toBe('/confidentialite');
  });
});
