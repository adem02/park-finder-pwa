// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { Coordinates } from '@domain/geo/coordinates';
import { ParkingFilters } from '@domain/search/parking-filters';
import { ListPage } from '@ui/features/search/list-page';
import { aRecord, filtersWith } from '../../support/parking.builder';
import { createTestContainer, renderInApp } from '../../support/render-in-app';

afterEach(cleanup);

/** La route lit les filtres dans l'URL ; ici un simple état suffit. */
function ListWithFilters({ initial }: { initial: ParkingFilters }) {
  const [filters, setFilters] = useState(initial);
  return <ListPage filters={filters} onFiltersChange={setFilters} />;
}

/** Position de test : Erlon (49.2577, 4.0287). Décalage en latitude ≈ 111 m par millième. */
const north = (meters: number) =>
  Coordinates.fromSnapshot({ latitude: 49.2577 + meters / 111_000, longitude: 4.0287 });

const records = [
  aRecord({ id: 'far', name: 'Parking Lointain', coordinates: north(1500), upvotes: 15 }),
  aRecord({ id: 'near', name: 'Parking Proche', coordinates: north(100) }),
  aRecord({ id: 'beyond', name: 'Parking Hors rayon', coordinates: north(3500), upvotes: 20 }),
];

const renderList = (initial = ParkingFilters.DEFAULT) => {
  const { container } = createTestContainer(records);
  return renderInApp(<ListWithFilters initial={initial} />, container);
};

const resultNames = () =>
  within(screen.getByRole('list', { name: 'Résultats' }))
    .getAllByRole('link')
    .map((link) => link.querySelector('span span')?.textContent);

describe('ListPage', () => {
  it('liste les parkings du rayon, du plus proche au plus loin, avec un lien vers le détail', async () => {
    renderList();

    expect(await screen.findByText('2 parkings gratuits à 2 km')).toBeInTheDocument();
    expect(resultNames()).toEqual(['Parking Proche', 'Parking Lointain']);
    expect(screen.getByRole('link', { name: /Parking Proche/ })).toHaveAttribute('href', '/parking/near');
  });

  it('applique les filtres du panneau, puis retire un critère depuis sa pastille', async () => {
    renderList();
    await screen.findByText('2 parkings gratuits à 2 km');

    fireEvent.click(screen.getByRole('button', { name: 'Filtres' }));
    const sheet = screen.getByRole('dialog', { name: 'Filtres' });
    fireEvent.click(within(sheet).getByRole('switch', { name: /Parkings vérifiés uniquement/ }));
    fireEvent.click(within(sheet).getByRole('button', { name: 'Appliquer' }));

    expect(await screen.findByText('1 parking gratuit à 2 km')).toBeInTheDocument();
    expect(resultNames()).toEqual(['Parking Lointain']);
    expect(screen.getByRole('button', { name: 'Filtres, 1 actif' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retirer le filtre Vérifiés' }));

    expect(await screen.findByText('2 parkings gratuits à 2 km')).toBeInTheDocument();
  });

  it('trie par popularité depuis le panneau', async () => {
    renderList();
    await screen.findByText('2 parkings gratuits à 2 km');

    fireEvent.click(screen.getByRole('button', { name: 'Filtres' }));
    const sheet = screen.getByRole('dialog', { name: 'Filtres' });
    fireEvent.click(within(sheet).getByRole('radio', { name: 'Popularité' }));
    fireEvent.click(within(sheet).getByRole('button', { name: 'Appliquer' }));

    await waitFor(() => expect(resultNames()).toEqual(['Parking Lointain', 'Parking Proche']));
    expect(screen.getByRole('button', { name: 'Retirer le filtre Tri : popularité' })).toBeInTheDocument();
  });

  it('« Réinitialiser » remet le brouillon aux valeurs par défaut sans appliquer', async () => {
    renderList(filtersWith({ radiusMeters: 5000 }));
    await screen.findByText('3 parkings gratuits à 5 km');

    fireEvent.click(screen.getByRole('button', { name: 'Filtres, 1 actif' }));
    const sheet = screen.getByRole('dialog', { name: 'Filtres' });
    expect(within(sheet).getByRole('radio', { name: '5 km' })).toBeChecked();

    fireEvent.click(within(sheet).getByRole('button', { name: 'Réinitialiser' }));

    expect(within(sheet).getByRole('radio', { name: '2 km' })).toBeChecked();
    expect(screen.getByText('3 parkings gratuits à 5 km')).toBeInTheDocument();
  });

  it('sans résultat, propose de retirer les filtres ou d’élargir le rayon', async () => {
    renderList(filtersWith({ radiusMeters: 2000, minSpots: 50 }));

    expect(await screen.findByRole('heading', { name: 'Aucun parking trouvé' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retirer les filtres' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Élargir à 5 km' }));

    expect(await screen.findByText('0 parking gratuit à 5 km')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retirer les filtres' }));
    expect(await screen.findByText('3 parkings gratuits à 5 km')).toBeInTheDocument();
  });
});
