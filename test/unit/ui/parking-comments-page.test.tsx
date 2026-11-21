// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ParkingCommentsPage } from '@ui/features/parking/parking-comments-page';
import { aComment, aRecord } from '../../support/parking.builder';
import { createTestContainer, renderInApp } from '../../support/render-in-app';

afterEach(cleanup);

describe('ParkingCommentsPage', () => {
  it('liste les commentaires et publie un nouveau commentaire en tête', async () => {
    const { container, store } = createTestContainer([
      aRecord({ id: 'p1', name: 'Parking Erlon', comments: [aComment({ content: 'Ancien avis.' })] }),
    ]);
    renderInApp(<ParkingCommentsPage parkingId="p1" />, container);

    expect(await screen.findByText('Ancien avis.')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Commentaires · Parking Erlon' })).toBeInTheDocument();

    const publish = screen.getByRole('button', { name: 'Publier' });
    expect(publish).toBeDisabled();

    fireEvent.change(screen.getByRole('textbox', { name: 'Votre commentaire' }), {
      target: { value: 'Plein le samedi matin.' },
    });
    fireEvent.click(publish);

    expect(await screen.findByText('Plein le samedi matin.')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Votre commentaire' })).toHaveValue(''));
    expect(store.find('p1')?.comments[0]?.content).toBe('Plein le samedi matin.');
  });

  it('invite à écrire le premier commentaire quand il n’y en a aucun', async () => {
    const { container } = createTestContainer([aRecord({ id: 'p1' })]);
    renderInApp(<ParkingCommentsPage parkingId="p1" />, container);

    expect(await screen.findByText(/Soyez le premier/)).toBeInTheDocument();
  });
});
