import { describe, expect, it } from 'vitest';
import { Availability } from '@domain/availability/availability';
import { ParkingFeaturePresenter } from '@ui/map/parking-feature.presenter';
import { NOW, aParking, minutesAgo } from '../../support/parking.builder';

describe('ParkingFeaturePresenter', () => {
  it('produit un point GeoJSON [lng, lat] par parking, avec son état de pin', () => {
    const parking = aParking({
      id: 'p1',
      availability: Availability.reported(6, minutesAgo(2)),
    });

    const collection = ParkingFeaturePresenter.toFeatureCollection([parking], NOW, null);

    expect(collection).toEqual({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: 'p1',
          geometry: { type: 'Point', coordinates: [4.0287, 49.2577] },
          properties: { id: 'p1', pinState: 'recent', selected: false },
        },
      ],
    });
  });

  it('marque le parking sélectionné', () => {
    const parkings = [aParking({ id: 'a' }), aParking({ id: 'b' })];

    const collection = ParkingFeaturePresenter.toFeatureCollection(parkings, NOW, 'b');

    expect(collection.features.map((f) => f.properties.selected)).toEqual([false, true]);
  });
});
