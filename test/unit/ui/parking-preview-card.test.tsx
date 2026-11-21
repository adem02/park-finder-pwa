// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Availability } from '@domain/availability/availability';
import { ParkingScore } from '@domain/vote/parking-score';
import { ParkingPreviewCard } from '@ui/features/map/parking-preview-card';
import { NOW, aParking, minutesAgo } from '../../support/parking.builder';

afterEach(cleanup);

describe('ParkingPreviewCard', () => {
  it('affiche le nom, les places libres, la fraîcheur et la distance', () => {
    const parking = aParking({
      name: 'Parking Erlon',
      totalSpots: 30,
      distanceMeters: 340,
      availability: Availability.reported(12, minutesAgo(4)),
    });

    render(<ParkingPreviewCard parking={parking} now={NOW} onClose={() => {}} />);

    expect(screen.getByRole('heading', { name: 'Parking Erlon' })).toBeInTheDocument();
    expect(screen.getByText(/12 places libres/)).toBeInTheDocument();
    expect(screen.getByText(/il y a 4 min/)).toBeInTheDocument();
    expect(screen.getByText('30 places au total · à 340 m')).toBeInTheDocument();
  });

  it('affiche « Complet » pour un parking signalé plein', () => {
    const parking = aParking({ availability: Availability.reported(0, minutesAgo(2)) });

    render(<ParkingPreviewCard parking={parking} now={NOW} onClose={() => {}} />);

    expect(screen.getByText('Complet')).toBeInTheDocument();
  });

  it('affiche le badge « Vérifié » seulement si le score dépasse 10', () => {
    const { rerender } = render(
      <ParkingPreviewCard parking={aParking({ score: ParkingScore.of(11, 0) })} now={NOW} onClose={() => {}} />,
    );
    expect(screen.getByText('Vérifié')).toBeInTheDocument();

    rerender(
      <ParkingPreviewCard parking={aParking({ score: ParkingScore.of(10, 0) })} now={NOW} onClose={() => {}} />,
    );
    expect(screen.queryByText('Vérifié')).not.toBeInTheDocument();
  });

  it('se ferme avec le bouton « Fermer »', () => {
    const onClose = vi.fn();

    render(<ParkingPreviewCard parking={aParking()} now={NOW} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));

    expect(onClose).toHaveBeenCalledOnce();
  });
});
