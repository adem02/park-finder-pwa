// @vitest-environment jsdom
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AddParkingSuccess } from '@ui/features/add-parking/add-parking-success';
import { PhotosStep } from '@ui/features/add-parking/photos-step';
import { usePhotoDraft } from '@ui/features/add-parking/use-add-parking';
import { createTestContainer, renderInApp } from '../../support/render-in-app';

afterEach(cleanup);

function PhotosHarness() {
  const draft = usePhotoDraft();
  return <PhotosStep draft={draft} />;
}

const file = (name: string) => new File(['image'], name, { type: 'image/jpeg' });

/** Le routeur de test rend l'écran de façon asynchrone : on attend le champ avant de l'utiliser. */
const choose = async (...files: File[]) =>
  fireEvent.change(await screen.findByLabelText('Choisir des photos'), { target: { files } });

describe('Étape photos', () => {
  it('affiche les photos préparées et permet d’en retirer une', async () => {
    const { container } = createTestContainer([]);
    renderInApp(<PhotosHarness />, container);

    await choose(file('entree.jpg'), file('places.jpg'));

    const list = screen.getByRole('list', { name: 'Photos ajoutées' });
    expect(await within(list).findByRole('img', { name: 'Photo 2' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retirer la photo 1' }));

    expect(within(list).getAllByRole('img')).toHaveLength(1);
  });

  it('limite à 3 photos et le dit', async () => {
    const { container } = createTestContainer([]);
    renderInApp(<PhotosHarness />, container);

    await choose(file('1.jpg'), file('2.jpg'), file('3.jpg'), file('4.jpg'));

    expect(await screen.findByText('3 photos maximum : 1 non ajoutée.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Choisir des photos')).not.toBeInTheDocument();
  });

  it('signale une image illisible sans bloquer les autres', async () => {
    const { container } = createTestContainer([]);
    renderInApp(<PhotosHarness />, container);

    await choose(file('notes.txt'), file('entree.jpg'));

    expect(await screen.findByText(/Format non pris en charge/)).toBeInTheDocument();
    expect(await screen.findByRole('img', { name: 'Photo 2' })).toBeInTheDocument();
  });
});

describe('Succès de l’ajout', () => {
  it('annonce les points gagnés et mène au parking créé', async () => {
    const { container } = createTestContainer([]);
    renderInApp(<AddParkingSuccess parkingId="p-new" />, container);

    expect(await screen.findByRole('heading', { name: 'Parking ajouté !' })).toBeInTheDocument();
    expect(screen.getByText('+20 points')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voir le parking' })).toHaveAttribute('href', '/parking/p-new');
  });
});
