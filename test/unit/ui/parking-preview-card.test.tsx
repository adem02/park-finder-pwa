// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Availability } from '@domain/availability/availability';
import { ParkingScore } from '@domain/vote/parking-score';
import { ParkingPreviewCard } from '@ui/features/map/parking-preview-card';
import { NOW, aParking, minutesAgo } from '../../support/parking.builder';
import { createTestContainer, renderInApp } from '../../support/render-in-app';

const render = (ui: ReactElement) => renderInApp(ui, createTestContainer([]).container);

afterEach(cleanup);

describe('ParkingPreviewCard', () => {
  it('affiche le nom, les places libres, la fraîcheur et la distance', async () => {
    const parking = aParking({
      name: 'Parking Erlon',
      totalSpots: 30,
      distanceMeters: 340,
      availability: Availability.reported(12, minutesAgo(4)),
    });

    render(<ParkingPreviewCard parking={parking} now={NOW} onClose={() => {}} />);

    expect(await screen.findByRole('heading', { name: 'Parking Erlon' })).toBeInTheDocument();
    expect(screen.getByText(/12 places libres/)).toBeInTheDocument();
    expect(screen.getByText(/il y a 4 min/)).toBeInTheDocument();
    expect(screen.getByText('30 places au total · à 340 m')).toBeInTheDocument();
  });

  it('affiche « Complet » pour un parking signalé plein', async () => {
    const parking = aParking({ availability: Availability.reported(0, minutesAgo(2)) });

    render(<ParkingPreviewCard parking={parking} now={NOW} onClose={() => {}} />);

    expect(await screen.findByText('Complet')).toBeInTheDocument();
  });

  it('affiche le badge « Vérifié » si le score dépasse 10', async () => {
    render(
      <ParkingPreviewCard parking={aParking({ score: ParkingScore.of(11, 0) })} now={NOW} onClose={() => {}} />,
    );

    expect(await screen.findByText('Vérifié')).toBeInTheDocument();
  });

  it('n’affiche pas le badge « Vérifié » à 10 ou moins', async () => {
    render(
      <ParkingPreviewCard parking={aParking({ score: ParkingScore.of(10, 0) })} now={NOW} onClose={() => {}} />,
    );

    await screen.findByRole('heading', { name: 'Parking Erlon' });
    expect(screen.queryByText('Vérifié')).not.toBeInTheDocument();
  });

  it('mène à la page détail du parking', async () => {
    render(<ParkingPreviewCard parking={aParking({ id: 'p-42' })} now={NOW} onClose={() => {}} />);

    expect(await screen.findByRole('link', { name: /Voir le détail/ })).toHaveAttribute('href', '/parking/p-42');
  });

  it('se ferme avec le bouton « Fermer »', async () => {
    const onClose = vi.fn();

    render(<ParkingPreviewCard parking={aParking()} now={NOW} onClose={onClose} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Fermer' }));

    expect(onClose).toHaveBeenCalledOnce();
  });
});
