// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Availability } from '@domain/availability/availability';
import { DEMO_USER } from '@infrastructure/in-memory/in-memory-parking.store';
import { ParkingDetailsPage } from '@ui/features/parking/parking-details-page';
import { aComment, aRecord, minutesAgo } from '../../support/parking.builder';
import { createTestContainer, renderInApp } from '../../support/render-in-app';

afterEach(cleanup);

const renderDetails = (record = aRecord({ id: 'p1' })) => {
  const { container, store } = createTestContainer([record]);
  renderInApp(<ParkingDetailsPage parkingId={record.id} />, container);
  return { store };
};

describe('ParkingDetailsPage (vrais use cases, store en mémoire)', () => {
  it('affiche le parking, sa disponibilité, ses votes et ses derniers commentaires', async () => {
    renderDetails(
      aRecord({
        id: 'p1',
        name: 'Parking Erlon',
        totalSpots: 30,
        availability: Availability.reported(12, minutesAgo(4)),
        upvotes: 11,
        comments: [aComment({ content: 'Accès facile.' })],
      }),
    );

    expect(await screen.findByRole('heading', { name: 'Parking Erlon', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Vérifié')).toBeInTheDocument();
    expect(screen.getByText(/12 places libres/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Parking fiable, 11 votes/ })).toBeInTheDocument();
    expect(screen.getByText('Accès facile.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Y aller' })).toBeInTheDocument();
  });

  it('enregistre un vote et met le compteur à jour', async () => {
    const { store } = renderDetails(aRecord({ id: 'p1', upvotes: 2 }));

    fireEvent.click(await screen.findByRole('button', { name: /Parking fiable, 2 votes/ }));

    const upvote = await screen.findByRole('button', { name: /Parking fiable, 3 votes/ });
    expect(upvote).toHaveAttribute('aria-pressed', 'true');
    await waitFor(() => expect(store.find('p1')?.userVote).toBe('UPVOTE'));
  });

  it('signale le parking plein depuis la feuille du bas', async () => {
    const { store } = renderDetails(aRecord({ id: 'p1', totalSpots: 30 }));

    fireEvent.click(await screen.findByRole('button', { name: 'Signaler la disponibilité' }));
    const sheet = screen.getByRole('dialog', { name: 'Signaler la disponibilité' });
    fireEvent.click(within(sheet).getByRole('button', { name: 'C’est plein' }));
    fireEvent.click(within(sheet).getByRole('button', { name: 'Envoyer' }));

    expect(await screen.findByText('Complet')).toBeInTheDocument();
    expect(screen.getByText('Merci ! Signalement enregistré (+5 points).')).toBeInTheDocument();
    expect(store.find('p1')?.availability.availableSpots).toBe(0);
  });

  it('propose Google Maps et Waze pour « Y aller »', async () => {
    renderDetails();

    fireEvent.click(await screen.findByRole('button', { name: 'Y aller' }));

    const sheet = screen.getByRole('dialog', { name: 'Y aller avec…' });
    expect(within(sheet).getByRole('link', { name: /Google Maps/ })).toHaveAttribute(
      'href',
      expect.stringContaining('destination=49.2577,4.0287'),
    );
    expect(within(sheet).getByRole('link', { name: /Waze/ })).toBeInTheDocument();
  });

  it('affiche « Parking introuvable » pour un identifiant inconnu', async () => {
    const { container } = createTestContainer([]);
    renderInApp(<ParkingDetailsPage parkingId="inconnu" />, container);

    expect(await screen.findByRole('heading', { name: 'Parking introuvable' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Retour à la carte' })).toBeInTheDocument();
  });
});

describe('Suppression du parking par son auteur', () => {
  it('l’auteur supprime son parking après confirmation', async () => {
    const { store } = renderDetails(aRecord({ id: 'p1', addedBy: DEMO_USER, upvotes: 0, downvotes: 0 }));

    fireEvent.click(await screen.findByRole('button', { name: 'Supprimer ce parking' }));
    const sheet = await screen.findByRole('dialog', { name: 'Supprimer ce parking ?' });
    fireEvent.click(within(sheet).getByRole('button', { name: 'Supprimer le parking' }));

    await waitFor(() => expect(store.find('p1')).toBeUndefined());
    expect(await screen.findByText('Parking supprimé.')).toBeInTheDocument();
  });

  it('explique le refus quand d’autres y ont déjà contribué', async () => {
    const { store } = renderDetails(aRecord({ id: 'p1', addedBy: DEMO_USER, upvotes: 3, downvotes: 0 }));

    fireEvent.click(await screen.findByRole('button', { name: 'Supprimer ce parking' }));
    const sheet = await screen.findByRole('dialog', { name: 'Supprimer ce parking ?' });
    fireEvent.click(within(sheet).getByRole('button', { name: 'Supprimer le parking' }));

    expect(await within(sheet).findByRole('alert')).toHaveTextContent(/appartient désormais à la communauté/);
    expect(store.find('p1')).toBeDefined();
  });

  it('n’est pas proposée sur le parking de quelqu’un d’autre', async () => {
    renderDetails(aRecord({ id: 'p1', name: 'Parking Erlon' }));

    expect(await screen.findByRole('heading', { name: 'Parking Erlon', level: 1 })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Supprimer ce parking' })).not.toBeInTheDocument();
  });
});
